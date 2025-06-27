const express = require('express');
const {
  createHackathon,
  getAllHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon,
  addCoHost
} = require('../controllers/hackathon.controller');

const router = express.Router();

router.route('/')
  .post(createHackathon)
  .get(getAllHackathons);

router.route('/:id')
  .get(getHackathonById)
  .put(updateHackathon)
  .delete(deleteHackathon);

router.route('/:id/cohosts').post(addCoHost);

module.exports = router;
