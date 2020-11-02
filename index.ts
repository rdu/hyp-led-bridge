import * as net from 'net';
import * as mqtt from 'mqtt';
import { CONFIG as config } from './config';
import { profile } from 'console';

var mqttClient = mqtt.connect(`mqtt://${config.MQTT_SERVER}`);
var socket = new net.Socket();

const send = (data: any) =>
{
    socket.write(`${JSON.stringify(data)}\n`);
};

const handleMQTTMessage = (json, profile: { instance: number, topic: string }) =>
{
    const state = (json && json.state);
    send({
        command: "instance",
        subcommand: state ? 'startInstance' : 'stopInstance',
        instance: profile.instance
    });
}

mqttClient.on('message', (topic, message) =>
{
    try
    {
        const json = JSON.parse(message.toString());
        const mtop = topic.substr(0, topic.length - 4);
        const ff = Object.keys(config.profiles).filter((a) =>
        {
            const p = config.profiles[a];
            return p.topic === mtop;
        });
        if (ff && ff.length > 0)
        {
            const profile = config.profiles[ff[0]];
            handleMQTTMessage(json, profile);
        }
    }
    catch (e)
    {
        console.log(e);
    }
});

Object.keys(config.profiles).forEach((key) =>
{
    const profile = config.profiles[key];
    mqttClient.subscribe(`${profile.topic}/set`, (err) =>
    {
        if (err)
        {
            console.log(err);
            process.exit();
        }
    });
});

const post = (profile: { instance: number, topic: string }, en: boolean) =>
{
    mqttClient.publish(`${profile.topic}`, JSON.stringify({ state: en }));
}

const handleData = (data: string) =>
{
    try
    {
        const json = JSON.parse(data);
        if (json.command === 'instance-update' && json.data)
        {
            json.data.forEach((a) =>
            {
                post(config.profiles[a.instance], a.running);
            });
        }
    }
    catch (e)
    {
        console.log(e);
    }
}

socket.connect({ port: config.HYPERION_PORT, host: config.HYPERION_HOST }, () =>
{
    console.log('connected');
    // send({
    //     "command": "instance",
    //     "subcommand": "switchTo",
    //     "instance": INSTANCE
    // })
    send({
        "command": "serverinfo",
        "subscribe": [
            "instance-update"
        ],
    });
});

var sockBuf = '';

socket.on('data', (data) =>
{
    sockBuf += data;
    var i;
    var l = 0;
    while ((i = sockBuf.indexOf('\n', l)) !== -1)
    {
        handleData(sockBuf.slice(l, i));
        l = i + 1;
    }
    if (l)
    {
        sockBuf = sockBuf.slice(l);
    }
});

socket.on('error', () => 
{
    console.log('error');
    process.exit();
});

socket.on('close', () =>
{
    console.log('Connection closed');
    process.exit();
});

socket.on('end', () =>
{
    console.log('Connection end');
    process.exit();
});

// socket.setTimeout(5000);
socket.on('timeout', () =>
{
    console.log('socket timeout');
    socket.end();
    process.exit();
});