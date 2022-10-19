const mongoose = require("mongoose");

const launcheSchema = new mongoose.Schema({
  flightNumber: {
    type: Number,
    required: true,
  },
  mission: {
    type: String,
    required: true,
  },
  rocket: {
    type: String,
    required: true,
  },
  launchDate: {
    type: Date,
    required: true,
  },
  target: {
    type: String
  },
  customers: [String],
  upcoming: {
    type: Boolean,
    required: true,
  },
  success: {
    type: Boolean,
    default: true,
    required: true,
  },
});

module.exports = mongoose.model("Launch", launcheSchema);

// const launch = {
//   flightNumber: 100,
//   mission: "kepler exploration x",
//   rocket: "explorer is1",
//   launchDate: new Date("december 27,2030"),
//   target: "kepler-442 b",
//   customers: ["ZTM", "NASA"],
//   upcoming: true,
//   success: true,
// };
