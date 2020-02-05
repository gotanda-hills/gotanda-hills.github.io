var UUID_SERVICE;
var UUID_CHAR;
var DEVICE_NAME;

var BUFFER_SIZE = 180000;
const PACKET_SIZE = 20;

var _device;
var _characteristic;
var data_buffer = new ArrayBuffer(BUFFER_SIZE);
var data = new Uint8Array(data_buffer);
var pos = 0;
var fname;
var out = [];

console.log(navigator.bluetooth);

function connect() {
  var DEVICE_NAME = document.querySelector("#device_name").value;
  if (DEVICE_NAME){
    var options = {
      filters: [
        {name: [DEVICE_NAME]}
      ],
      optionalServices: [UUID_SERVICE]
    }
  } else {
    var options = {
      acceptAllDevices:true,
      optionalServices: [UUID_SERVICE]
    }
  };

  navigator.bluetooth.requestDevice(options)
  .then(device => {
    console.log('device.name:', device.name);
    console.log('device.id:', device.id);
    console.log('device.gatt:', device.gatt);
    console.log('Connecting to GATT Server...');
    document.getElementById("message").innerHTML = "connected to " + device.name;
    _device = device;
    return _device.gatt.connect();
  })
  .then(server => {
    console.log('Connected.');
    console.log('server:', server);
    console.log('Getting Service...');
    return server.getPrimaryService(UUID_SERVICE);
  })
  .then(service => {
    console.log('service:', service);
    console.log('Getting Characteristic...');
    return Promise.all([
      service.getCharacteristic(UUID_CHAR)
    ])
  })
  .then(characteristic => {
    console.log('characteristic:', characteristic);
    _characteristic = characteristic;
    _chara = _characteristic[0];
    _chara.startNotifications();
    _chara.addEventListener('characteristicvaluechanged', onReceiveData);
    console.log("start notification");
    document.getElementById("message").innerHTML = "start notification";
  })
  .catch(error => {
    console.log("ERROR:", error);
    document.getElementById("message").innerHTML = error;
  });
};

function onReceiveData(event){
  let characteristic = event.target; 
  let value = characteristic.value;
  var tmp = new Uint8Array(value.buffer);

  if (pos==0){
    fname = String(Date.now());
    console.log("file name: ", fname);
    out.push(fname);
    document.getElementById("message").innerHTML = out;
  }

  data.set(tmp, pos);
  pos += PACKET_SIZE;
  document.getElementById("received_value").innerHTML = String(pos) + " / " + BUFFER_SIZE;

  if (pos > BUFFER_SIZE - PACKET_SIZE){
    var _fname = fname;
    pos = 0;
    console.log("download:", _fname);
    var blob = new Blob([data], {type: "application/octet-stream"});
    let anchor = document.createElement('a');
    anchor.download = _fname;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
    delete anchor;
  }
}

function _writeValue() {
  var text = document.querySelector("#send_value").value;
  console.log('text:', text);
  if (text.length % 2 != 0){
    console.log("ERROR: text.length is not even!")
  }

  let buffSize = text.length / 2;
  var buffer = new ArrayBuffer(buffSize);
  var dataView = new DataView(buffer);
  var offset = 0;

  for(var i=0; i<buffSize; i++){
    var s = text.slice(offset*2, offset*2 + 2)
    s = parseInt(s, 16);
    var v = '0x' + (('00' + s.toString(16).toUpperCase()).substr(-2));
    console.log(v);
    dataView.setUint8(offset, v);
    offset += 1;
  }
  _characteristic[0].writeValue(dataView);

  document.getElementById("write_value").innerHTML = text;
}

function disconnect() {
	if(!_device || !_device.gatt.connected) return;
  _device.gatt.disconnect();

	alert("disconnect");
}

function getService() {
  UUID_SERVICE = document.querySelector("#uuid_service").value;
  document.getElementById("service_value").innerHTML = UUID_SERVICE;
}

function getChara() {
  UUID_CHAR = document.querySelector("#uuid_chara").value;
  document.getElementById("chara_value").innerHTML = UUID_CHAR;
}

function getDeviceName() {
  DEVICE_NAME = document.querySelector("#device_name").value;
  document.getElementById("display_name").innerHTML = DEVICE_NAME;
}

function getBufferSize() {
  var buf_tmp  = document.querySelector("#buffer_size").value;
  if (buf_tmp){
    BUFFER_SIZE = parseInt(buf_tmp);
    console.log(BUFFER_SIZE);
    document.getElementById("message").innerHTML = "buffer size is " + BUFFER_SIZE;
  }
}