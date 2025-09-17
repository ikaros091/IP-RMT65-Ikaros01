const { Op } = require("sequelize");
const {Anime} = require("../models");

class Controller{
    static  async AnimeList(req, res, next){
        try {
            const { search, genre, sort, page = 1, limit = 8 } = req.query;

            const where = {};
            if (search) {
                where.title = { [Op.iLike || Op.like]: `%${search}%` };
            }
            if (genre) {
                // genres is stored as TEXT; check substring
                where.genres = { [Op.like]: `%${genre}%` };
            }

            const order = [];
            if (sort === 'score') {
                order.push(['score', 'DESC']);
            }

            const offset = (Number(page) - 1) * Number(limit);

            const { rows: data, count: totalData } = await Anime.findAndCountAll({
                where,
                order,
                limit: Number(limit),
                offset,
            });

            const totalPages = Math.ceil(totalData / Number(limit)) || 0;

            return res.status(200).json({
                page: Number(page),
                limit: Number(limit),
                totalData,
                totalPages,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = Controller