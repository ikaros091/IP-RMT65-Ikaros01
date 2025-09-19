"use strict";
const axios = require("axios");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    let animes = [];

    for (let page = 1; page <= 30; page++) {
      try {
        console.log(`Fetching page ${page} ...`);
        let { data } = await axios.get(
          `https://api.jikan.moe/v4/top/anime?page=${page}`
        );

        let pageAnimes = data.data.map((anime) => ({
          jikan_id: anime.mal_id,
          title: anime.title,
          image_url: anime.images.jpg.image_url,
          episodes: anime.episodes || 0,
          status: anime.status || "Unknown",
          score: anime.score || 0,
          synopsis: anime.synopsis || "",
          genres: anime.genres.map((g) => g.name).join(", "),
          demographics: anime.demographics.map((d) => d.name).join(", "),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        animes.push(...pageAnimes);

        // biar gak kena rate limit
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Failed fetching page ${page}`, err.message);
      }
    }

    // optional: hapus dulu biar gak duplicate error
    await queryInterface.bulkDelete("Animes", null, {});

    await queryInterface.bulkInsert("Animes", animes, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("Animes", null, {});
  },
};
