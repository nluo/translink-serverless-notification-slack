A lambda function to subscribe to the Queensland TransLink Real-Time data and send notifications to the route and stop that you care about to Slack.

## Motivation

I commute to work by public transport (Bus) on weekdays. The issue is the bus does not come on time. For example, I usually take the scheduled 8:44 am bus it rarely comes on time (almost always a few minutes early/late).

TransLink does provide a mobile app to track to bus of the stop, but the problem is, the app is quite hard to use and you have to every time open it and select the bus stop to see the information.

Fortunately, [TransLink](https://gtfsrt.api.translink.com.au/) has provided a real-time transit information in n Google's Protobuf format, as per the GTFS real-time specification.

So this little lambda function consumes the real-time data provided by TransLink, and sends the notification of the route you would like to know to slack through webhook.

![demo](https://lh3.googleusercontent.com/mcu4fKfM1We5oKwpr3hap8HFHmwyAXnUZ2Kx1kLsInCI0OvAPvlnbw0Fy7Bkd0VHPK-9HeLERjobx0WCacTBA2FeJ7E6oEvWIQ3ZnWtzPYFmuEpoX5P4r6ovV8EOeYsqEhib_PWH6BE=w375-h812-no)

## Deploy your lambda function

Follow [Serverless guide](https://serverless.com/framework/docs/providers/aws/guide/credentials/) to setup your aws credentials. It's actually quite simple: basically in Mac/Linux/Windows, you need to have your `access_key` and `access_secret` in `~/.aws/credentials` file.

Then, change `env.json.dist` to `env.json` and fill up your slack webhook. (You could follow this [guide](https://api.slack.com/slack-apps) to quickly create a slack app in your workspace that accepts webhook)

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

