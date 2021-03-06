"use strict";
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const url = "https://gtfsrt.api.translink.com.au/Feed/SEQ";
const axios = require("axios");

const constructSlackText = (displayText, stopInfo) => {
  // return `${displayText}, upcoming is: ` + '```' + `${JSON.stringify(stopInfo, null, 4)}` + '```';
  return displayText;
};

const postToSlack = displayText => {
  const { slack_webhook } = process.env;

  if (!slack_webhook || slack_webhook === "") {
    return;
  }

  const options = {
    url: slack_webhook,
    method: "POST",
    data: {
      text: displayText
    }
  };

  return axios(options)
};

const calculateMinutesBetweenNow = endDate => {
  var today = new Date();
  const minutes = parseInt(
    (Math.abs(endDate.getTime() - today.getTime()) / (1000 * 60)) % 60
  );
  const seconds = parseInt(
    (Math.abs(endDate.getTime() - today.getTime()) / 1000) % 60
  );

  return `${minutes} minutes ${seconds} seconds`;
};

module.exports.webhook = async () => {
  const { stop_id, route, stop_name: stopName } = process.env;

  if (!stop_id) {
    return {
      statusCode: 400,
      message: "You have to configure stop_id in serverless.yml"
    };
  }

  try {
    const response = await axios({
      method: "get",
      url,
      responseType: "arraybuffer"
    });

    if (response.status == 200) {
      const feed = GtfsRealtimeBindings.FeedMessage.decode(response.data);
      const now = new Date();

      const stopInfo = feed.entity
        .map(function(entity) {
          if (entity.trip_update) {
            const { stop_time_update, trip } = entity.trip_update;

            if (trip.schedule_relationship == 3) {
              // console.log(entity);
              return null;
            }

            if (stop_time_update.length) {
              const stop = stop_time_update.find(s => s["stop_id"] == stop_id);

              if (stop) {

                let t;
                if (stop.arrival) {
                  t = new Date(stop.arrival.time.low * 1000);
                } else {
                  t = new Date(stop.departure.time.low * 1000);
                }

                const info = {
                  routeId: entity.trip_update.trip.route_id,
                  arrivalTime: t,
                  trip: {...trip},
                };
                return info;
              }
            }
          }
        })
        .filter(s => s)
        .filter(s => {
          if (route === 'all') {
            return true;
          }

          const busRoute = s.routeId.split("-")[0];

          if (!busRoute) {
            return true;
          }

          return route == busRoute;
        })
        .filter(s => {
          return s.arrivalTime.getTime() - now.getTime() >= 0;
        })
        .sort((s1, s2) => s1.arrivalTime - s2.arrivalTime);

      const localTimezoneStopInfo = stopInfo.map(s => {
        return {
          ...s,
          arrivalTime: s.arrivalTime.toString()
        };
      });

      if (stopInfo.length) {
        const temp = stopInfo[0];
        const busTimeTableText = calculateMinutesBetweenNow(temp.arrivalTime);
        const busRoute = temp.routeId.split("-")[0];

        const displayText = `The next Route:${busRoute} is coming to ${
          stopName ? stopName : "stop"
        } in ${busTimeTableText},  Scheduled Time: ${temp.trip.start_time}`;

        await postToSlack(
          constructSlackText(displayText, localTimezoneStopInfo)
        );
      }

      return {
        statusCode: 200,
        body: JSON.stringify(localTimezoneStopInfo)
      };
    }
  } catch (error) {
    throw error;
  }

};
