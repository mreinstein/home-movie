import { createMachine, interpret }     from '@xstate/fsm'
import { Client, DefaultMediaReceiver } from 'castv2-client'
import lookup                           from 'lookup-multicast-dns'
import mdns                             from 'mdns'


lookup('movies.local', function (err, ip) {
  console.log('ip::', ip) // is resolved using normal dns (173.194.116.32 on my machine)
})


let host

const castMachine = createMachine({
	initial: 'uninitialized',
	states: {
		uninitialized: {
			on: {
				INITIALIZE: 'setup'
			}
		},
		setup: {
			entry: function () {
				const browser = mdns.createBrowser(mdns.tcp('googlecast'))

				browser.on('serviceUp', function(service) {
				  console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port)
				  
				  host = service.addresses[0]
				  //ondeviceup(service.addresses[0])
				  //browser.stop()
				  castService.send('SERVICE_UP')
				})
				 
				browser.start()
			},
			on: {
				SERVICE_UP: 'ready'
			}
		},
		ready: {
			entry: function () {
			   const client = new Client()
 
			  client.connect(host, function() {
			    console.log('connected, launching app ...')
			 
			    client.launch(DefaultMediaReceiver, function(err, player) {
			      const media = {
			 
			      	// Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
			        //contentId: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
			        contentId: 'http://192.168.1.88:8000/videos/disneys_robinhood.mp4',

			        contentType: 'video/mp4',
			        streamType: 'BUFFERED', // or LIVE
			 
			        // Title and cover displayed while buffering
			        metadata: {
			          type: 0,
			          metadataType: 0,
			          title: "Big Buck Bunny", 
			          images: [
			            { url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg' }
			          ]
			        }        
			      }
			 
			      player.on('status', function(status) {
			        console.log('status broadcast playerState=%s', status.playerState)
			      })
			 
			      console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId)
			 
			      player.load(media, { autoplay: true }, function (err, status) {
			 		if (err) {
			 			console.log('error loading media:', err)
			 			castService.send('CLIENT_ERROR')
			 		} else {
			 			console.log('media loaded playerState=%s', status.playerState)
			 		}
			      })
			 
			    })
			    
			  })
			 
			  client.on('error', function(err) {
			    console.log('Error: %s', err.message)
			    castService.send('CLIENT_ERROR')
			  })
			},
			exit: function () {
				client.close()
			},
			on: {
				CLIENT_ERROR: 'error'
			}
		},
		error: {
			entry: function () {

			}
		}
	}  
})

const castService = interpret(castMachine).start()
castService.send('INITIALIZE')
//castService.stop()
