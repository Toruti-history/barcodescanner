// app.js

const codeReader = new ZXing.BrowserMultiFormatReader();
const videoElement = document.getElementById('video');
const resultElement = document.getElementById('result');
const attendanceTableBody = document.querySelector('#attendanceTable tbody');
const messageElement = document.getElementById('message');

let attendanceData = [];
localStorage.removeItem('attendanceData');
displayAttendanceData();

let lastScannedCode = '';
let lastScanTime = 0;

// 出欠データを表示
function displayAttendanceData() {
    attendanceTableBody.innerHTML = '';
}

// 連続スキャン機能
async function startScanning() {
    try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        const selectedDeviceId = videoInputDevices[0].deviceId;

        const formats = [ZXing.BarcodeFormat.EAN_8];

        codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, err) => {
            if (result) {
                const currentTime = new Date().getTime();

                if (result.text === lastScannedCode && currentTime - lastScanTime < 2000) {
                    return;
                }

                lastScannedCode = result.text;
                lastScanTime = currentTime;

                resultElement.textContent = `スキャン完了: ${result.text}`;

                const currentFormattedTime = new Date().toLocaleString();
                attendanceData.push({ time: currentFormattedTime, id: result.text });

                localStorage.setItem('attendanceData', JSON.stringify(attendanceData));

                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${currentFormattedTime}</td><td>${result.text}</td>`;
                attendanceTableBody.appendChild(tr);

                startScanning();
            }

            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err);
                resultElement.textContent = `エラー: ${err}`;
            }
        }, { formats });
    } catch (err) {
        console.error(err);
        resultElement.textContent = `エラー: ${err}`;
    }
}

// CSVダウンロード機能
function downloadCSV() {
    const csvContent = "data:text/csv;charset=utf-8,日付,番号\n" +
        attendanceData.map(e => `${e.time},${e.id}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance.csv");
    document.body.appendChild(link);
    link.click();
}

// コピー機能
function copyData() {
    const dataToCopy = attendanceData.map(e => `${e.time}, ${e.id}`).join("\n");

    navigator.clipboard.writeText(dataToCopy)
        .then(() => {
            messageElement.textContent = 'コピーしました！'; // 成功メッセージ
        })
        .catch(err => {
            console.error('コピーに失敗しました: ', err);
            messageElement.textContent = 'コピーできませんでした。'; // 失敗メッセージ
        });
}

// スキャン開始ボタンを押すと連続スキャンを開始
document.getElementById('startButton').addEventListener('click', startScanning);

// CSVダウンロードボタンを追加
document.getElementById('downloadButton').addEventListener('click', downloadCSV);

// コピー機能を追加
document.getElementById('copyButton').addEventListener('click', copyData);
