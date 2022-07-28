var YouTube = require('youtube-node');
require('dotenv').config();

var youtube = new YouTube();

youtube.setKey(process.env.YOUTUBE_API);

export default youtube;
