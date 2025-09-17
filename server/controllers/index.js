const { Op } = require("sequelize");
const { Anime, User, MyList } = require("../models");

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

    static async addToList(req, res, next) {
        try {
            const user_id = req.user.id;
            const { anime_id } = req.body;

            const mylist = await MyList.create({ user_id, anime_id, progress: 0, status: 'planned' });

            return res.status(201).json(mylist);
        } catch (error) {
            next(error);
        }
    }

    static async getMyList(req, res, next) {
        try {
            const user_id = req.user.id;
            const lists = await MyList.findAll({
                where: { user_id },
                include: [{ model: Anime, attributes: ['title', 'genres', 'status', 'score', 'image_url'] }]
            });

            return res.status(200).json(lists);
        } catch (error) {
            next(error);
        }
    }

    static async getMyListById(req, res, next) {
        try {
            const user_id = req.user.id;
            const id = req.params.id;

            const list = await MyList.findOne({
                where: { id, user_id },
                include: [{ model: Anime, attributes: ['title', 'episodes', 'status', 'score', 'synopsis', 'genres', 'demographics'] }]
            });

            if (!list) return res.status(404).json({ message: 'Not Found' });

            return res.status(200).json(list);
        } catch (error) {
            next(error);
        }
    }

    static async updateMyList(req, res, next) {
        try {
            const user_id = req.user.id;
            const id = req.params.id;
            const { progress } = req.body;

            const list = await MyList.findOne({ where: { id, user_id }, include: [Anime] });
            if (!list) return res.status(404).json({ message: 'Not Found' });

            list.progress = progress;

            const episodes = list.Anime && list.Anime.episodes ? Number(list.Anime.episodes) : 0;
            if (progress == 0) list.status = 'planned';
            else if (progress > 0 && progress < episodes) list.status = 'watching';
            else if (progress >= episodes) list.status = 'completed';

            await list.save();

            return res.status(200).json(list);
        } catch (error) {
            next(error);
        }
    }

    static async deleteMyList(req, res, next) {
        try {
            const user_id = req.user.id;
            const id = req.params.id;

            const list = await MyList.findOne({ where: { id, user_id } });
            if (!list) return res.status(404).json({ message: 'Not Found' });

            await MyList.destroy({ where: { id, user_id } });

            return res.status(200).json({ message: 'Successfully deleted' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = Controller