# Noise hacking maths


## The Problem - Audible Wave Leak

The restaurant that is next to my department is playing salsa music all the days, and I work from home but lukily my windows are soundproof.
There is one unique instrument that is common in all salsa songs that leaks passing my sound-insulation, and is an anoying repetitive sound, thats enought to focus in cancelling it as a priority.
This sound is a kind of repetitive drum.


## The easy bad solution

White noise fills all the frecuency gaps, It doesn't cancel the sound but if it was perfect will fill all the audible.
But it's not convinient hearing white noise many hours so I needed to create an invisible anti-wave defense. 


## Signal Decomposition

The purpose is extracting information of the specific wave of the specific insturment that leaks the sound-insulation.

 - frecuency
 - power (dbs)
 - amplitude
 - waveform (sinusoidal, squarewave, triangle, sawtooth or complex ones)
 - electromagnetic or pressure wave


1. record the music (with all the instruments)
2. soundhoud to identify the song
3. youtube2mp3 to download the mp3
4. openmusic.ai to separate the dump using AI
5. ffmpeg to do the wav conversion 
    `ffmpeg -i shit_drums.mp3 -ar 44100 -ac 2 shit_drums.wav`
6. create an spectogram with sox
7. feh -F spectrogram.png


openmunsic separated well the instruments but in the drums track sound two differnt drumps, and I need to distinguish them, but the repetition frecuency of every drum is different so we can identify the target wave, and as expected is low frequency because of that trespasses the walls.

It's necessary to pinpoint the sox parameters to display well the wave you need, it worth to read sox manpage.

Main options:

### Wave Frecuency Sample Rate 

The manpage explains it perfecly: "Gives the sample rate in Hz (or kHz if appended with `k') of the file"
For instance for a kilo herthz unit `-r 10k`
In this case the freq is under the khz, i pinpointed `-r 100` for 100 hertz

### Time vs Frecuency - Repetition Frequency

I pinpointed -x value to display it in interval of seconds.

### Remove Noise - Cleaning the Drums

This is for cleaning the 2 drum instruments removing noise and the awesome tool sox does this automatically but if you specify the seconds that take in startng the drums, then can learn the initial noise and remove it.
How to know in which second starts? well I put the time unit in seconds with -x param and I can visualize the drum I want and calculate the seconds adapting -x  


```
sox shit_drums.wav -n spectrogram -x 4096 -y 1024 -X 100 -o spectrogram.png
```

sox is really great, don’t you agree? and you also have pysox! 










## Thanks

hardwarehackinges

 


