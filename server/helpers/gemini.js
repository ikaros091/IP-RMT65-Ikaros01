const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// List of candidate model ids to try (ordered) - prefer text/chat bison which are commonly available
const candidateModels = [
  'models/text-bison-001',
  'models/chat-bison-001',
  'gemini-1',
  'gemini-pro'
];

let chosenModel = null;

async function pickModel() {
	if (chosenModel) return chosenModel;
	// Prefer listing available models if SDK exposes listModels
	try {
		if (typeof genAI.listModels === 'function') {
			const res = await genAI.listModels();
			let available = [];
			if (Array.isArray(res)) {
				available = res.map(r => r.name || r.id || r.model || '');
			} else if (res && Array.isArray(res.models)) {
				available = res.models.map(r => r.name || r.id || r.model || '');
			} else if (res && Array.isArray(res.model)) {
				available = res.model.map(r => r.name || r.id || r.model || '');
			}

			for (const candidate of candidateModels) {
				const found = available.find(a => a && (a.toLowerCase().includes(candidate.toLowerCase()) || candidate.toLowerCase().includes(a.toLowerCase())));
				if (found) {
					chosenModel = genAI.getGenerativeModel({ model: candidate });
					console.log('Using generative model (from listModels):', candidate);
					return chosenModel;
				}
			}
		}
	} catch (listErr) {
		console.warn('ListModels not available or failed:', listErr && listErr.message ? listErr.message : listErr);
	}

	// Fallback: try to getGenerativeModel for candidates without probing generation calls
	for (const m of candidateModels) {
		try {
			const mdl = genAI.getGenerativeModel({ model: m });
			chosenModel = mdl;
			console.log('Using generative model (fallback):', m);
			break;
		} catch (e) {
			console.warn('Model not available (fallback):', m, e.message || e);
		}
	}
	if (!chosenModel) throw new Error('No available generative model');
	return chosenModel;
}

// Wrapper exposing common methods used in controller
const wrapper = {
	async generateContent(prompt) {
		const mdl = await pickModel();
		if (typeof mdl.generateContent === 'function') return mdl.generateContent(prompt);
		if (typeof mdl.generate === 'function') return mdl.generate(prompt);
		if (typeof mdl.predict === 'function') return mdl.predict(prompt);
		throw new Error('No supported generate method on model');
	},
	async generate(prompt) {
		const mdl = await pickModel();
		if (typeof mdl.generate === 'function') return mdl.generate(prompt);
		if (typeof mdl.generateContent === 'function') return mdl.generateContent(prompt);
		if (typeof mdl.predict === 'function') return mdl.predict(prompt);
		throw new Error('No supported generate method on model');
	},
	async predict(prompt) {
		const mdl = await pickModel();
		if (typeof mdl.predict === 'function') return mdl.predict(prompt);
		if (typeof mdl.generate === 'function') return mdl.generate(prompt);
		if (typeof mdl.generateContent === 'function') return mdl.generateContent(prompt);
		throw new Error('No supported predict method on model');
	}
};

// Expose a method to list available models for diagnostics
wrapper.listAvailableModels = async function() {
	try {
		if (typeof genAI.listModels === 'function') {
			const res = await genAI.listModels();
			// Normalize various shapes
			if (Array.isArray(res)) return res;
			if (res && Array.isArray(res.models)) return res.models;
			if (res && Array.isArray(res.model)) return res.model;
			return res;
		}
		return { message: 'listModels not supported by SDK' };
	} catch (e) {
		return { error: e.message || String(e) };
	}
};

module.exports = wrapper;
