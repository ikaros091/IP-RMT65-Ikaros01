const model = require("../helpers/gemini");
const { Anime, MyList } = require("../models");

class RecommendationController {
  static async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;

      // Ambil anime list user
      const myList = await MyList.findAll({
        where: { user_id: userId },
        include: [Anime],
      });

      // Ambil semua anime dari database
      const allAnimes = await Anime.findAll({
        limit: 200, // batasi biar gak overload
      });

      // Ambil judul & genre user
      const userAnimeTitles = myList.map(m => m.Anime.title);
      const userGenres = myList.map(m => m.Anime.genres).join(", ");

      // Prompt ke Gemini
      const prompt = `
Kamu adalah sistem rekomendasi anime. 
User sudah menonton: ${userAnimeTitles.join(", ")}.
Genre favoritnya adalah: ${userGenres}.
Berikan 5 rekomendasi anime dari daftar berikut:
${allAnimes.map(a => `${a.title} (${a.genres})`).join("\n")}

Jawaban hanya dalam format JSON dengan struktur:
[
  { "title": "Judul Anime", "reason": "Kenapa cocok" }
]
      `;

      // Helper: local fallback recommender (used when AI disabled or AI fails)
      const localFallback = () => {
        // Determine user's top genres from their myList
        const genreCounts = {};
        myList.forEach(m => {
          const g = m.Anime && m.Anime.genres ? String(m.Anime.genres) : '';
          g.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(gg => {
            genreCounts[gg] = (genreCounts[gg] || 0) + 1;
          });
        });

        // sort genres by count
        const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
        const preferredGenre = sortedGenres[0] || null;

        // Filter local animes by preferred genre (or take highest score if none)
        let candidates = allAnimes;
        if (preferredGenre) {
          const pg = preferredGenre.toLowerCase();
          candidates = allAnimes.filter(a => (a.genres || '').toLowerCase().includes(pg));
        }

        // sort by score desc and take top 5
        candidates = candidates.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);

        const recommendations = candidates.map(a => ({
          title: a.title,
          reason: preferredGenre ? `Matches your interest in ${preferredGenre}` : 'Highly rated in database',
          image_url: a.image_url || null
        }));

        return recommendations;
      };

      // Check available models first. If none compatible, skip AI and use local recommender to avoid repeated failing calls
      // If ENABLE_AI is not explicitly true, skip remote AI to avoid API calls/404s
      if (process.env.ENABLE_AI !== 'true') {
        console.warn('Remote AI disabled (ENABLE_AI != true), using local fallback');
        const recommendations = localFallback();
        return res.json({ recommendations });
      }

      let availableModels = null;
      try {
        if (typeof model.listAvailableModels === 'function') {
          availableModels = await model.listAvailableModels();
        }
      } catch (lmErr) {
        console.warn('listAvailableModels failed:', lmErr && lmErr.message ? lmErr.message : lmErr);
        availableModels = null;
      }

      const hasCompatibleModel = (availableModels && Array.isArray(availableModels) && availableModels.length > 0) || (availableModels && Array.isArray(availableModels.models) && availableModels.models.length > 0);

      if (!hasCompatibleModel) {
        console.warn('No compatible AI model available, using local fallback');
        // go directly to fallback logic
        throw new Error('No compatible AI model');
      }

      // Try AI first; if it fails, fall back to a local recommender
      try {
        // Try a few ways to call the model depending on SDK version
        let result;
        if (typeof model.generateContent === 'function') {
          result = await model.generateContent(prompt);
        } else if (typeof model.generate === 'function') {
          result = await model.generate(prompt);
        } else if (typeof model.predict === 'function') {
          result = await model.predict(prompt);
        } else {
          throw new Error('No supported model method found');
        }

        // Extract text from possible response shapes
        let text = '';
        if (result && result.response && typeof result.response.text === 'function') {
          text = result.response.text();
        } else if (result && typeof result.text === 'function') {
          text = result.text();
        } else if (result && result.output && Array.isArray(result.output) && result.output[0] && result.output[0].content) {
          const content = result.output[0].content;
          text = content.map(c => c.text || JSON.stringify(c)).join('\n');
        } else {
          text = typeof result === 'string' ? result : JSON.stringify(result);
        }

        console.log('Gemini raw text:', text);

        // Attempt to parse AI output and enrich with image_url from DB when possible
        const parsed = JSON.parse(text);
        const enriched = parsed.map(item => {
          const title = item.title || '';
          const match = allAnimes.find(a => a.title && title && (a.title.toLowerCase() === title.toLowerCase() || a.title.toLowerCase().includes(title.toLowerCase())));
          return {
            title: item.title,
            reason: item.reason,
            image_url: match ? match.image_url : null
          };
        });
        return res.json({ recommendations: enriched });
      } catch (aiErr) {
        // If AI fails for any reason, fallback to simple local recommender
        console.error('AI recommendation failed, falling back to local recommender:', aiErr);
        const recommendations = localFallback();
        return res.json({ recommendations });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  }
}

module.exports = RecommendationController;
