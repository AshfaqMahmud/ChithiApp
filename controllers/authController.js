const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res)=>{
    try{
        const {username, password} = req.body;
        const user = await User.findOne({username});
        if(!user || !(await user.comparePassword(password))) {
            throw new Error('Invalid credentials');
        }
        const token = jwt.sign({userId: user._id}, 'secret_key', {expiresIn: '1h'});
        res.json({token});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
};