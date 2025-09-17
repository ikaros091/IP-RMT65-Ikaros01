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

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      res.json({ recommendations: JSON.parse(text) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  }
}

module.exports = RecommendationController;
