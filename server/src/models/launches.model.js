const axios = require("axios");

const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;
const SPACE_API_URL = "https://api.spacexdata.com/v4/launches/query";

// const launches = new Map();

// let latestFlightNumber = 100;
// const launch = {
//   flightNumber: 100,
//   mission: "kepler exploration x",
//   rocket: "explorer is1",
//   launchDate: new Date("december 27,2030"),
//   target: "Kepler-442 b",
//   customers: ["ZTM", "NASAaa"],
//   upcoming: true,
//   success: true,
// };

// launches.set(launch.flightNumber, launch);
// saveLaunch(launch);

async function populateLaunches() {
  console.log("downloading launch data....");
  const response = await axios.post(SPACE_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("problem downloading launch data");
    throw new Error("Launch data download failed");
  }
  // DOCS ARRAY
  const launchDocs = response.data.docs;

  // ITERATE OVER INDIVIDUAL LAUNCH DATA
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    // MAPING THE LAUNCH FIELD WITH THE DATA FROM SPACEX_API
    const launch = {
      flightNumber: launchDoc.flight_number,
      mission: launchDoc.name,
      rocket: launchDoc.rocket.name,
      launchDate: new Date(launchDoc.date_local),
      upcoming: launchDoc.upcoming,
      success: launchDoc.success,
      customers,
    };

    // INDIVIDUAL DATA BEING SAVED IN DATABASE
    await saveLaunch(launch);
  }
  console.log("data loaded successfully");
}

async function loadLaunchesData() {
  // TO REDUCE THE LOAD OF SPACEX_API
  // CHECK WHETHER DATA ALREADY LOADED IN DATABASE OR NOT?
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    focket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("launch data already loaded");
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  });
}

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);

  // return Array.from(launches.values());
}

async function saveLaunch(launch) {
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber");

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function scheduleNewLaunch(launch) {
  const planet = await planets.findOne({
    keplerName: launch.target,
  });
  // console.log(planet);
  if (!planet) {
    throw new Error("No matching planet found!");
  }

  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    upcoming: true,
    success: true,
    customers: ["Zero to Mastery", "NASA"],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
}

// function addNewLanunch(launch) {

//   latestFlightNumber++;
//   launches.set(
//     latestFlightNumber,
//     Object.assign(launch, {
//       success: true,
//       upcoming: true,
//       customers: ["Zero to Mastery", "NASA"],
//       flightNumber: latestFlightNumber,
//     })
//   );
// }

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  // aborted.upcoming = false;
  // aborted.success = false;
  return aborted.modifiedCount === 1;
}

module.exports = {
  loadLaunchesData,
  existsLaunchWithId,
  getAllLaunches,
  // addNewLanunch,
  scheduleNewLaunch,
  abortLaunchById,
};
