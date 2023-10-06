let senderStream; // Declare senderStream globally

window.onload = async () => {
    // Initialize senderStream here, for example, by getting access to the user's webcam
    senderStream = await navigator.mediaDevices.getUserMedia({ video: true });

    document.getElementById('my-button').onclick = () => {
        console.log('button clicked');
        init();
    }
}

async function init() {
    const peer = createPeer();
    peer.addTransceiver("video", { direction: "recvonly" })
}

function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    console.log('peer created');

    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    if (!senderStream) {
        console.log('Sender stream is not available.');
        return; // Don't proceed if senderStream is not available
    }

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    };

    try {
        const { data } = await axios.post('/consumer', payload);
        console.log('Response from /consumer', data);
        const desc = new RTCSessionDescription(data.sdp);
        peer.setRemoteDescription(desc).catch(error => console.log(error.response));
    } catch (error) {
        console.log('Error in /consumer request:', error);
    }
}

function handleTrackEvent(e) {
    console.log('Received video stream from broadcaster.');
    console.log(e);
    console.log(e.streams[0]);
    document.getElementById("video").srcObject = e.streams[0];
};