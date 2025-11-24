let selectedFiles = [];
let joinedAudio = null;
let loopedAudio = null;
let loopFile = null;

// ============= ОБЪЕДИНЕНИЕ ФАЙЛОВ =============

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const files = document.getElementById('files');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '#f0f4ff';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.backgroundColor = '';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = '';
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(fileList) {
    selectedFiles = Array.from(fileList);
    displayFiles();
    uploadArea.style.display = 'none';
    document.getElementById('fileList').style.display = 'block';
}

function displayFiles() {
    files.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const li = document.createElement('li');
        const fileSize = (file.size / (1024 * 1024)).toFixed(2);
        li.innerHTML = `
            <div>
                <div class="file-name"><i class="fas fa-music"></i> ${file.name}</div>
                <div class="file-size">${fileSize} MB</div>
            </div>
            <button onclick="removeFile(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        files.appendChild(li);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    if (selectedFiles.length === 0) {
        resetFiles();
    } else {
        displayFiles();
    }
}

function resetFiles() {
    selectedFiles = [];
    joinedAudio = null;
    uploadArea.style.display = 'block';
    fileList.style.display = 'none';
    document.getElementById('progress').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    fileInput.value = '';
}

async function joinAudio() {
    if (selectedFiles.length === 0) {
        alert('Пожалуйста, загрузите хотя бы один аудиофайл');
        return;
    }

    document.getElementById('progress').style.display = 'block';
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = '0%';

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let totalDuration = 0;
        let audioBuffers = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            progressFill.style.width = (i / selectedFiles.length * 100) + '%';
            
            const arrayBuffer = await selectedFiles[i].arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            audioBuffers.push(audioBuffer);
            totalDuration += audioBuffer.duration;
        }

        const offlineContext = new OfflineAudioContext(
            audioBuffers[0].numberOfChannels,
            audioContext.sampleRate * totalDuration,
            audioContext.sampleRate
        );

        let currentTime = 0;
        for (let buffer of audioBuffers) {
            const source = offlineContext.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineContext.destination);
            source.start(currentTime);
            currentTime += buffer.duration;
        }

        progressFill.style.width = '95%';
        joinedAudio = await offlineContext.startRendering();
        progressFill.style.width = '100%';

        setTimeout(() => {
            document.getElementById('progress').style.display = 'none';
            document.getElementById('result').style.display = 'block';
        }, 500);

    } catch (error) {
        console.error('Ошибка при объединении:', error);
        alert('Ошибка при объединении аудиофайлов. Пожалуйста, проверьте формат файлов.');
        document.getElementById('progress').style.display = 'none';
    }
}

function downloadAudio() {
    if (!joinedAudio) {
        alert('Нет объединенного аудио для скачивания');
        return;
    }

    convertToMP3(joinedAudio, 'joined_audio_' + new Date().getTime() + '.mp3');
}

// ============= ПОВТОР ПЕСНИ =============

const loopUploadArea = document.getElementById('loopUploadArea');
const loopFileInput = document.getElementById('loopFileInput');
const loopFileInfo = document.getElementById('loopFileInfo');

loopUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    loopUploadArea.style.backgroundColor = '#ffe5ec';
});

loopUploadArea.addEventListener('dragleave', () => {
    loopUploadArea.style.backgroundColor = '';
});

loopUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    loopUploadArea.style.backgroundColor = '';
    handleLoopFile(e.dataTransfer.files[0]);
});

loopFileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleLoopFile(e.target.files[0]);
    }
});

function handleLoopFile(file) {
    if (!file.type.startsWith('audio/')) {
        alert('Пожалуйста, загрузите аудиофайл');
        return;
    }
    
    loopFile = file;
    displayLoopFileInfo();
    loopUploadArea.style.display = 'none';
    loopFileInfo.style.display = 'block';
}

async function displayLoopFileInfo() {
    const fileSize = (loopFile.size / (1024 * 1024)).toFixed(2);
    document.getElementById('loopFileName').textContent = loopFile.name;
    document.getElementById('loopFileSize').textContent = `${fileSize} MB`;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await loopFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const duration = audioBuffer.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        document.getElementById('loopFileDuration').textContent = `Длительность: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
        console.error('Ошибка при получении длительности:', error);
    }
}

function resetLooping() {
    loopFile = null;
    loopedAudio = null;
    loopUploadArea.style.display = 'block';
    loopFileInfo.style.display = 'none';
    document.getElementById('loopProgress').style.display = 'none';
    document.getElementById('loopResult').style.display = 'none';
    loopFileInput.value = '';
}

async function loopAudio(hours) {
    if (!loopFile) {
        alert('Пожалуйста, загрузите аудиофайл');
        return;
    }

    document.getElementById('loopProgress').style.display = 'block';
    const loopProgressText = document.getElementById('loopProgressText');
    const loopProgressFill = document.getElementById('loopProgressFill');
    loopProgressText.textContent = `Повторение на ${hours} часов...`;
    loopProgressFill.style.width = '0%';

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await loopFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const originalDuration = audioBuffer.duration;
        const targetDurationSeconds = hours * 3600;
        const repeatCount = Math.ceil(targetDurationSeconds / originalDuration);
        const totalDuration = repeatCount * originalDuration;
        
        loopProgressFill.style.width = '10%';

        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioContext.sampleRate * totalDuration,
            audioContext.sampleRate
        );

        let currentTime = 0;
        for (let i = 0; i < repeatCount; i++) {
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start(currentTime);
            currentTime += originalDuration;
            
            loopProgressFill.style.width = (10 + (i / repeatCount) * 80) + '%';
        }

        loopProgressFill.style.width = '95%';
        loopedAudio = await offlineContext.startRendering();
        loopProgressFill.style.width = '100%';

        setTimeout(() => {
            document.getElementById('loopProgress').style.display = 'none';
            document.getElementById('loopResult').style.display = 'block';
            document.getElementById('loopResultText').textContent = `Ваша песня успешно повторена на ${hours} часов!`;
        }, 500);

    } catch (error) {
        console.error('Ошибка при повторении:', error);
        alert('Ошибка при повторении аудиофайла. Проверьте формат файла и объем памяти.');
        document.getElementById('loopProgress').style.display = 'none';
    }
}

function loopAudioCustom() {
    const customHours = document.getElementById('customHours').value;
    
    if (!customHours || customHours < 1) {
        alert('Пожалуйста, введите количество часов (минимум 1)');
        return;
    }
    
    if (customHours > 1000) {
        alert('Максимальное количество часов: 1000');
        return;
    }
    
    loopAudio(parseInt(customHours));
}

function downloadLoopedAudio() {
    if (!loopedAudio) {
        alert('Нет повторенного аудио для скачивания');
        return;
    }

    convertToMP3(loopedAudio, 'looped_audio_' + new Date().getTime() + '.mp3');
}

// ============= КОНВЕРТАЦИЯ В MP3 =============

async function convertToMP3(audioBuffer, filename) {
    try {
        const mp3Encoder = new lamejs.Mp3Encoder(
            audioBuffer.numberOfChannels,
            audioBuffer.sampleRate,
            192
        );

        const samples = [];
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            samples.push(audioBuffer.getChannelData(channel));
        }

        const blockSize = 8192;
        const mp3Data = [];

        for (let i = 0; i < samples[0].length; i += blockSize) {
            const left = samples[0].subarray(i, i + blockSize);
            const right = audioBuffer.numberOfChannels > 1 
                ? samples[1].subarray(i, i + blockSize) 
                : left;

            // Convert float samples to int16
            const leftInt16 = floatTo16BitPCM(left);
            const rightInt16 = floatTo16BitPCM(right);

            const mp3buf = mp3Encoder.encodeBuffer(leftInt16, rightInt16);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        const mp3buf = mp3Encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Ошибка при конвертации в MP3:', error);
        alert('Ошибка при сохранении в формате MP3. Попробуйте еще раз.');
    }
}

function floatTo16BitPCM(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}