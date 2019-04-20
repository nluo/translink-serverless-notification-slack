"use strict";
const GtfsRealtimeBindings = require("gtfs-realtime-bindings");
const request = require("request");
const url = "https://gtfsrt.api.translink.com.au/Feed/SEQ";

const constructSlackText = (displayText, stopInfo) => {
  return `${displayText}, upcoming is: ` + '```' + `${JSON.stringify(stopInfo)}` + '```';
}

const postToSlack = displayText => {
  const { slack_webhook } = process.env;

  if (!slack_webhook || slack_webhook === "") {
    return resolve();
  }

  const options = {
    uri: slack_webhook,
    method: "POST",
    json: {
      text: displayText
    }
  };

  return new Promise((resolve, reject) => {
    return request(options, error => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
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
      message: 'You have to configure stop_id in serverless.yml'
    }
  }

  const requestSettings = {
    method: "GET",
    url,
    encoding: null
  };
  return new Promise((resolve, reject) => {
    return request(requestSettings, async (error, response, body) => {
      if (error) {
        return reject(JSON.stringify(error));
      }
      if (!error && response.statusCode == 200) {
        const feed = GtfsRealtimeBindings.FeedMessage.decode(body);

        const now = new Date();
        const stopInfo = feed.entity
          .map(function(entity) {
            if (entity.trip_update) {
              const { stop_time_update } = entity.trip_update;
              if (stop_time_update.length) {
                const stop = stop_time_update.find(
                  s => s["stop_id"] === stop_id
                );

                if (stop) {
                  const t = new Date(stop.arrival.time.low * 1000);

                  const info = {
                    routeId: entity.trip_update.trip.route_id,
                    arrivalTime: t
                    // meta: entity
                  };
                  return info;
                }
              }
            }
          })
          .filter(s => s)
          .filter(s => {
            return s.arrivalTime.getTime() - now.getTime() >= 0
          })
          .sort((s1, s2) => s1.arrivalTime - s2.arrivalTime)

        const localTimezoneStopInfo = stopInfo.map(s => {
          return {
            ...s,
            arrivalTime: s.arrivalTime.toString()
          }
        })

        if (stopInfo.length) {
          const temp = stopInfo[0];
          const busTimeTableText = calculateMinutesBetweenNow(temp.arrivalTime);
          const busRoute = temp.routeId.split("-")[0];

          const displayText = `The next Route:${busRoute} is coming to ${stopName ? stopName : 'stop'} in ${busTimeTableText}`;

          
          await postToSlack(constructSlackText(displayText, localTimezoneStopInfo));
        }

        return resolve({
          statusCode: 200,
          body: JSON.stringify(localTimezoneStopInfo)
        });
      }
    });
  });

  // return {
  //   statusCode: 200,
  //   body: JSON.stringify({
  //     message: "hello world"
  //   })
  // };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
