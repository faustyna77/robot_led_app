
    // DOM Elements
    const connectButton = document.getElementById('connectBleButton');
    const disconnectButton = document.getElementById('disconnectBleButton');
    
    const led1ButtonOn = document.getElementById('led1ButtonOn');
    const led1ButtonOff = document.getElementById('led1ButtonOff');
    const led2ButtonOn = document.getElementById('led2ButtonOn');
    const led2ButtonOff = document.getElementById('led2ButtonOff');
    const led3ButtonOn = document.getElementById('led3ButtonOn');
    const led3ButtonOff = document.getElementById('led3ButtonOff');
    const servoOn = document.getElementById('servoOn');
    const servoOff = document.getElementById('servoOff');
    const servoOn2 = document.getElementById('servoOn2');
    const servoOff2 = document.getElementById('servoOff2');
    const servoOn3 = document.getElementById('servoOn3');
    const servoOff3 = document.getElementById('servoOff3');
    const servoOn4 = document.getElementById('servoOn4');
    const servoOff4 = document.getElementById('servoOff4');
    const servoOn5 = document.getElementById('servoOn5');
    const servoOff5 = document.getElementById('servoOff5');
    const servoOn6 = document.getElementById('servoOn6');
    const servoOff6 = document.getElementById('servoOff6');
    const retrievedValue = document.getElementById('valueContainer');
    const latestValueSent = document.getElementById('valueSent');
    const bleStateContainer = document.getElementById('bleState');
    const timestampContainer = document.getElementById('timestamp');

    //Define BLE Device Specs
    var deviceName ='ESP32';
    var bleService = '19b10000-e8f2-537e-4f6c-d104768a1214';
    var ledCharacteristic = '19b10002-e8f2-537e-4f6c-d104768a1214';
    var sensorCharacteristic= '19b10001-e8f2-537e-4f6c-d104768a1214';

    //Global Variables to Handle Bluetooth
    var bleServer;
    var bleServiceFound;
    var sensorCharacteristicFound;

    // Connect Button (search for BLE Devices only if BLE is available)
    connectButton.addEventListener('click', (event) => {
        if (isWebBluetoothEnabled()){
            connectToDevice();
        }
    });

    // Disconnect Button
    disconnectButton.addEventListener('click', disconnectDevice);

    // Write to the ESP32 LED Characteristic
    led1ButtonOn.addEventListener('click', () => writeOnCharacteristic(1));
    led1ButtonOff.addEventListener('click', () => writeOnCharacteristic(0));
    led2ButtonOn.addEventListener('click', () => writeOnCharacteristic(2));
    led2ButtonOff.addEventListener('click', () => writeOnCharacteristic(3));
    led3ButtonOn.addEventListener('click', () => writeOnCharacteristic(4));
    led3ButtonOff.addEventListener('click', () => writeOnCharacteristic(5));
    servoOn.addEventListener('click', () => writeOnCharacteristic(6));
    servoOff.addEventListener('click',()=>writeOnCharacteristic(7));
    servoOn2.addEventListener('click', () => writeOnCharacteristic(8));
    servoOff2.addEventListener('click',()=>writeOnCharacteristic(9));
    servoOn3.addEventListener('click', () => writeOnCharacteristic(10));
    servoOff3.addEventListener('click',()=>writeOnCharacteristic(11));
    servoOn4.addEventListener('click', () => writeOnCharacteristic(12));
    servoOff4.addEventListener('click',()=>writeOnCharacteristic(13));
    servoOn5.addEventListener('click', () => writeOnCharacteristic(14));
    servoOff5.addEventListener('click',()=>writeOnCharacteristic(15));
    servoOn6.addEventListener('click', () => writeOnCharacteristic(16));
    servoOff6.addEventListener('click',()=>writeOnCharacteristic(17));
    // Check if BLE is available in your Browser
    function isWebBluetoothEnabled() {
        if (!navigator.bluetooth) {
            console.log("Web Bluetooth API is not available in this browser!");
            bleStateContainer.innerHTML = "Web Bluetooth API is not available in this browser!";
            return false;
        }
        console.log('Web Bluetooth API supported in this browser.');
        return true;
    }

    // Connect to BLE Device and Enable Notifications
    function connectToDevice(){
        console.log('Initializing Bluetooth...');
        navigator.bluetooth.requestDevice({
            filters: [{name: deviceName}],
            optionalServices: [bleService]
        })
        .then(device => {
            console.log('Device Selected:', device.name);
            bleStateContainer.innerHTML = 'Connected to device ' + device.name;
            bleStateContainer.style.color = "#24af37";
            device.addEventListener('gattservicedisconnected', onDisconnected);
            return device.gatt.connect();
        })
        .then(gattServer =>{
            bleServer = gattServer;
            console.log("Connected to GATT Server");
            return bleServer.getPrimaryService(bleService);
        })
        .then(service => {
            bleServiceFound = service;
            console.log("Service discovered:", service.uuid);
            return service.getCharacteristic(sensorCharacteristic);
        })
        .then(characteristic => {
            console.log("Characteristic discovered:", characteristic.uuid);
            sensorCharacteristicFound = characteristic;
            characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicChange);
            characteristic.startNotifications();
            console.log("Notifications Started.");
            return characteristic.readValue();
        })
        .then(value => {
            console.log("Read value: ", value);
            const decodedValue = new TextDecoder().decode(value);
            console.log("Decoded value: ", decodedValue);
            retrievedValue.innerHTML = decodedValue;
        })
        .catch(error => {
            console.log('Error: ', error);
        });
    }

    function onDisconnected(event){
        console.log('Device Disconnected:', event.target.device.name);
        bleStateContainer.innerHTML = "Device disconnected";
        bleStateContainer.style.color = "#d13a30";

        connectToDevice();
    }

   
    function handleCharacteristicChange(event){
        const newValueReceived = new TextDecoder().decode(event.target.value);
        console.log("Characteristic value changed: ", newValueReceived);
        retrievedValue.innerHTML = newValueReceived;
        timestampContainer.innerHTML = getDateTime();
    }

    function writeOnCharacteristic(value){
        if (bleServer && bleServer.connected) {
            bleServiceFound.getCharacteristic(ledCharacteristic)
            .then(characteristic => {
                console.log("Found the LED characteristic: ", characteristic.uuid);
                const data = new Uint8Array([value]);
                return characteristic.writeValue(data);
            })
            .then(() => {
                latestValueSent.innerHTML = value;
                console.log("Value written to LED characteristic:", value);
            })
            .catch(error => {
                console.error("Error writing to the LED characteristic: ", error);
            });
        } else {
            console.error("Bluetooth is not connected. Cannot write to characteristic.")
            window.alert("Bluetooth is not connected. Cannot write to characteristic. \n Connect to BLE first!")
        }
    }

    function disconnectDevice() {
        console.log("Disconnect Device.");
        if (bleServer && bleServer.connected) {
            if (sensorCharacteristicFound) {
                sensorCharacteristicFound.stopNotifications()
                    .then(() => {
                        console.log("Notifications Stopped");
                        return bleServer.disconnect();
                    })
                    .then(() => {
                        console.log("Device Disconnected");
                        bleStateContainer.innerHTML = "Device Disconnected";
                        bleStateContainer.style.color = "#d13a30";
                    })
                    .catch(error => {
                        console.log("An error occurred:", error);
                    });
            } else {
                console.log("No characteristic found to disconnect.");
            }
        } else {
            // Throw an error if Bluetooth is not connected
            console.error("Bluetooth is not connected.");
            window.alert("Bluetooth is not connected.")
        }
    }

    function getDateTime() {
        var currentdate = new Date();
        var day = ("00" + currentdate.getDate()).slice(-2); // Convert day to string and slice
        var month = ("00" + (currentdate.getMonth() + 1)).slice(-2);
        var year = currentdate.getFullYear();
        var hours = ("00" + currentdate.getHours()).slice(-2);
        var minutes = ("00" + currentdate.getMinutes()).slice(-2);
        var seconds = ("00" + currentdate.getSeconds()).slice(-2);

        var datetime = day + "/" + month + "/" + year + " at " + hours + ":" + minutes + ":" + seconds;
        return datetime;
    }