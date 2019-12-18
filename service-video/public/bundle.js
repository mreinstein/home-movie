(function () {
  'use strict';

  // TMDB key (public on purpose)
  const key = '9d2bff12ed955c7f1f74b83187f188ae';
  const base = 'https://api.themoviedb.org';


  // from https://github.com/lacymorrow/movie-art/blob/master/index.js
  async function getConfiguration () {
    const url = base + encodeURI( '/3/configuration?api_key=' + key );

    const response = await fetch(url);
    const json = await response.json();

    const baseURL = json.images.base_url;
    const sizes = json.images.poster_sizes;

    return { baseURL, sizes }
  }


  async function movieArt (query) {
    const { baseURL, sizes } = await getConfiguration();

    const opts = {
      type: 'movie',
      output: 'poster'
    };

    const url =
      base +
      encodeURI(
        '/3/search/' +
          opts.type +
          '?api_key=' +
          key +
          '&query=' +
          query +
          (  '&year=' + opts.year  )
      );

    const response = await fetch(url);
    const details = await response.json();

    console.log('details:', details);

    const size = sizes.indexOf( opts.size ) !== -1 ? opts.size : sizes[sizes.length - 1];
    const backdrop = encodeURI( baseURL + size + details.results[0].backdrop_path );
    const poster = encodeURI( baseURL + size + details.results[0].poster_path );

    return { backdrop, poster }
  }


  /*
  async function getVideoList() {
    const response = await fetch('/videos')
    return response.json()
  }


  async function renderVideoList() {
    const videos = await getVideoList()
    for(let i=0; i < videos.length; i++) {
      const a = document.createElement('a')
      a.href = '#'
      a.innerText = videos[i]
      a.addEventListener('click', function(ev) {
        ev.preventDefault()
        const mediaUrl = `http://movies.local:8000/videos/${videos[i]}`
        console.log('playing', mediaUrl)
        //up.send(JSON.stringify({ type: 'PLAY', mediaUrl }))
      })

      const p = document.createElement('p')
      p.appendChild(a)
      document.body.appendChild(p)
    }
  }
  */


  async function main () {
    const result = await movieArt('music and lyrics');
    console.log('result:', result);
    //renderVideoList()
  }


  main();

}());
