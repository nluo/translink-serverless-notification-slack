A lambda function to subscribe to the Queensland TransLink Real-Time data and send notifications to the route and stop that you care about to Slack.

## Motivation

I commute to work by public transport (Bus) daily. The issue is the bus does not come very on time. For example, I usually take the scheduled 8:44am bus it rarely comes on time (either 3-4 minutes earlier or later).

TransLink does provide a mobile app to track to bus of the stop, but the problem is, the app is quite hard to use and you have to every time open it and select the bus stop to see the information.

Fortunately, TransLink has provided a real-time transit information in n Google's Protobuf format, as per the GTFS real-time specification.

So this little lambda function consumes the realtime data, and sends the notification to slack through webhook.

## Get Start


