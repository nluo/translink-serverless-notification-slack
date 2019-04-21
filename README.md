A lambda function to subscribe to the Queensland TransLink Real-Time data and send notifications to the route and stop that you care about to Slack.

## Motivation

I commute to work by public transport (Bus) daily. The issue is the bus does not come very on time. For example, I usually take the scheduled 8:44am bus it rarely comes on time (either 3-4 minutes earlier or later).

TransLink does provide a mobile app to track to bus of the stop, but the problem is, the app is quite hard to use and you have to every time open it and select the bus stop to see the information.

Fortunately, TransLink has provided a real-time transit information in n Google's Protobuf format, as per the GTFS real-time specification.

So this little lambda function consumes the real-time data, and sends the notification to slack through webhook.

## Get Start

Follow Serverless guide to setup your aws credentials.

Change `env.json.dist` to `env.json` and fill up your slack webhook. You could follow this guide to quickly create a slack app in your workspace that accepts webhook.

Configure the `stop_id` (it could be a bus stop, train station etc.), `route`, `stop_verbose_name` in `serverless.yml`, you could easily find the `stop_id` from google maps. Note, only `stop_id` is the required field.

```
route: 138
stop_id: 5840
stop_verbose_name: Calam Rd near Lear St
```

Inside the project, run:
```
yarn

sls deploy
```

Then Serverless framework will create the function and returns the URL to you. 

e.g. it will output something like this:

```
endpoints:
  GET - https://xxxxxxxxx.execute-api.ap-southeast-2.amazonaws.com/dev/
```

Click the endpoint and you should see the upcoming buses/trains in the configured `stop_id`, and you will receive a slack message too.

