const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const webrtc = require("wrtc");


let senderStream;

app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/consumer", async ({ body }, res) => {
    try {
        if (!senderStream) {
            return res.status(500).json({ error: "Sender stream is not available." });
        }

        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                }
            ]
        });
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }

        res.json(payload);
    } catch (error) {
        console.error("Error in /consumer:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

app.post('/broadcast', async ({ body }, res) => {
    try {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                }
            ]
        });
        peer.ontrack = (e) => handleTrackEvent(e, peer);
        const desc = new webrtc.RTCSessionDescription(body.sdp);
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }

        res.json(payload);
    } catch (error) {
        console.error("Error in /broadcast:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

function handleTrackEvent(e, peer) {
    senderStream = e.streams[0];
    console.log('Received video stream from broadcaster.');
}

app.listen(5000, () => console.log('Server started on port 5000'));
