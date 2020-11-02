import * as net from 'net';
import * as mqtt from 'mqtt';

const INSTANCE = process.env.INSTANCE || 1;
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'hyperion_wledschrank';
const MQTT_SERVER = process.env.MQTT_SERVER || 'mqtt.moerse';
const HYPERION_PORT = process.env.HYPERION_PORT || '19444';
const HYPERION_HOST = process.env.HYPERION_HOST || '10.10.0.124';

var mqttClient = mqtt.connect(`mqtt://${MQTT_SERVER}`);
var socket = new net.Socket();

const send = (data: any) =>
{
    socket.write(`${JSON.stringify(data)}\n`);
};

const handleMQTTMessage = (json) =>
{
    const state = (json && json.state);
    send({
        command: 'componentstate',
        componentstate: {
            component: 'LEDDEVICE',
            state
        }
    });
}

mqttClient.on('message', (topic, message) =>
{
    try
    {
        const json = JSON.parse(message.toString());
        handleMQTTMessage(json);
    }
    catch (e)
    {
        console.log(e);
    }
});

mqttClient.subscribe(`${MQTT_TOPIC}/set`, (err) =>
{
    if (err)
    {
        console.log(err);
        process.exit();
    }
});

const post = (en) =>
{
    mqttClient.publish(`${MQTT_TOPIC}`, JSON.stringify({ state: en }));
}

const handleData = (data: string) =>
{
    try
    {
        const json = JSON.parse(data);
        if (json.data && json.data.name === 'LEDDEVICE')
            post(json.data.enabled);
    }
    catch (e)
    {
        console.log(e);
    }
}

socket.connect({ port: parseInt(HYPERION_PORT), host: HYPERION_HOST }, () =>
{
    console.log('connected');
    send({
        "command": "instance",
        "subcommand": "switchTo",
        "instance": INSTANCE
    })

    send({
        "command": "serverinfo",
        "subscribe": [
            "components-update"
        ],
        "tan": INSTANCE
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