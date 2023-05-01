import { model } from "mongoose";
import { categories, transactions } from "../models/model.js";

export const create_Categories = (req, res) => {
    const cookie = req.cookies
    if (!cookie.accessToken) {
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
    }
    const { type, color } = req.body;
    const new_categories = new categories({ type, color });
    new_categories.save()
        .then(data => res.json(data))
        .catch(err => res.status(400).json(err))
}

export const get_Categories = async (req, res) => {
    const cookie = req.cookies
    if (!cookie.accessToken) {
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
    }
    let data = await categories.find({})

    let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))

    return res.json(filter)
}

export const create_transaction = async (req, res) => {
    const cookie = req.cookies
    if (!cookie.accessToken) {
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
    }
    const { name, amount, type } = req.body;
    const new_transactions = new transactions({ name, amount, type });
    new_transactions.save()
        .then(data => res.json(data))
        .catch(err => res.status(400).json(err))
}

export const get_transaction = async (req, res) => {
    const cookie = req.cookies
    if (!cookie.accessToken) {
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
    }
    let data = await transactions.find({});
    return res.json(data);
}

export const delete_transaction = async (req, res) => {
    const cookie = req.cookies
    if (!cookie.accessToken) {
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
    }
    let data = await transactions.deleteOne({ _id: req.body._id });
    return res.json("deleted");

}

export const get_labels = (req, res) => {
    const cookie = req.cookies
    if (!cookie.accessToken) {
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
    }
    transactions.aggregate([
        {
            $lookup: {
                from: "categories",
                localField: "type",
                foreignField: "type",
                as: "categories_info"
            },
        },
        {
            $unwind: "$categories_info"
        }
    ]).then(result => {
        let data = result.map(v => Object.assign({}, { _id: v._id, name: v.name, amount: v.amount, type: v.type, color: v.color }))
        res.json(data);
    }).catch(error => {
        res.status(400).json(error)
    })


}
