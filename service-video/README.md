# service-video

http video streaming server


## serve a movie
```bash
node ./service-video/index.js
```

then play it:
```bash
node ./cast.js
```


## command line snippets

### converting a movie file format:

ffmpeg needs aac installed:
```bash
brew install ffmpeg --with-fdk-aac
```

```
ffmpeg -i movie.avi movie.mp4
```

### copying files to a raspberry pi

be sure to set up passwordless login (pem login.) Then:

```bash
scp *.mp4 pi@address:/path/to/destination/
```
