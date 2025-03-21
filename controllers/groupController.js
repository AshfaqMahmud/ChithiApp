const Group = require('../models/Group');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
    try{
        const {name, adminId} = req.body;
        const group = new Group({name, admin: adminId, members: [adminId]});
        await group.save();
        res.status(201).json({message: 'Group created successfully', group});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
};

exports.joinGroup = async (req, res)=> {
    try{
        const {gId, uId} = req.body;
        const group = await Group.findById(gId);
        if(!group) throw new Error('Group not in existence');
        if(!group.members.includes(uId)) {
            group.members.push(uId);
            await group.save();
        }
        res.json({message: 'Joined group successfully', group});
    } catch (error) {
        res.status(400).json({ error: error.message});
    }
};