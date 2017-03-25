process.title = 'LootRedeem'

var fs = require('fs')
var querystring = require('querystring')

var async = require('async')
var cheerio = require('cheerio')
var ini = require('ini')
var prompt = require('prompt')
var request = require('request').defaults({ jar: true })

var configFileName = 'config.ini'
var configFilePath = './' + configFileName

var gameEventUrl = ''
var gameName = ''
var gameNameRest = ''

var games = [
	{
		name: 'Shaiya',
		key: 'sylat',
		eventUrl: 'http://lat.shaiya.aeriagames.com/itemmall/free-rewards/get-event/sy'
	},
	/*
	
]

function init() {
	console.log('Starting LootRedeem...')
	printSupportedGames()
	setGame(4)
	ensureConfigExists()
	main()
}

function printSupportedGames() {
	var supportedGames = 'Supported Games: '
	for (var i = 0; i < games.length; i++) {
		if(i !== 0) {
			supportedGames += ', '
		}
		supportedGames += games[i].name
	}
	console.log(supportedGames)
}

function ensureConfigExists() {
	console.log('Checking if ' + configFileName + ' file exists')

	if(fs.existsSync(configFilePath)) {
		console.log(configFileName + ' exists!')
	} else {
		console.log(configFileName + ' doesn\'t exist. Creating it...')
		fs.writeFileSync(configFilePath, '')
	}
}

function main() {
	console.log('################')
	console.log('##### MAIN #####')
	console.log('################')
	console.log('[1] Redeem')
	console.log('[2] Auto Redeem')
	console.log('[3] Accounts')
	console.log('[4] Change Game [' + gameName + ']')
	console.log('[5] Exit')

	prompt.start()
	prompt.get(['option'], function (err, result) {
		prompt.pause()
		if(err) {
			return
		}

		if(result.option === '1') {
			redeem(true)
		} else if(result.option === '2') {
			autoRedeem()
		} else if(result.option === '3') {
			manageAccounts()
		} else if(result.option === '4') {
			changeGame()
		} else if(result.option === '5') {
			process.exit()
		} else {
			console.log('Invalid Option.')
			main()
		}
	})
}

function redeem(backToMain) {
	var accounts = ini.parse(fs.readFileSync(configFilePath, 'utf-8'))

	var betterAccounts = []
	for (var key in accounts) {
		var account = accounts[key]
		betterAccounts.push({
			username: account.username,
			password: account.password
		})
	}

	console.log('Start to redeem all Accounts')

	async.eachSeries(betterAccounts, function(account, cb) {
		redeemAccount(account.username, account.password, function() {
			cb()
		})
	}, function(err) {
		console.log('Done with redeeming all Accounts')
		if(backToMain) {
			main()
		}
	})
}

function autoRedeem() {
	console.log('Please specify the interval (in minutes) in which you\'d like to have your accounts redeemed.')
	console.log('Note that it\'s not possible to bypass the hour limit from AeriaGames.')
	console.log('So it will just try to redeem again.')
	console.log('This mode is useful if you put it on a server for example.')
	console.log('So you\'ll never forget to redeem your accounts again!')

	var options = {
		properties: {
			interval: {
				type: 'number',
				default: '60'
			}
		}
	}

	prompt.start()
	prompt.get(options, function (err, result) {
		prompt.pause()
		if(err) {
			return
		}

		console.log('Accounts will be redeemed automatically all ' + result.interval + ' minutes.')

		var interval = parseInt(result.interval) * 60000

		redeem()

		setInterval(function() {
			redeem()
		}, interval)
	})
}

function redeemAccount(username, password, cb) {
	console.log('Start to redeem Account ' + username)
	var cookieJar = request.jar()
	async.waterfall([
		 function(cb) {
			request.post({
				url: 'https://www.aeriagames.com/dialog/oauth?lang=en&response_type=code&client_id=7e5fcda63b004c8b0e5706d042463a5d050dd0615&state=ignite&theme=api_ignite&req_refresh=1&redirect_uri=https%3A%2F%2Fapi.aeriagames.com%2Fconnect%2Flogin_success',
				headers: {
					'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729); Ignite/Windows 1.13.3296'
				},
				form: {
					'edit[form_id]': 'account_login',
					'edit[id]': username,
					'edit[method]': 'oauth2',
					'edit[pass]': password,
					'edit[destination]': 'https://www.aeriagames.com/dialog/oauth/authorize?billing_id=0&game_id=ign2us&name=Aeria+Ignite&redirect_uri=https%3A%2F%2Fapi.aeriagames.com%2Fconnect%2Flogin_success&scope=scope_general%2Cscope_promotion%2Cscope_billing%2Cscope_social%2Cscope_message&client_id=7e5fcda63b004c8b0e5706d042463a5d050dd0615&response_type=code&state=ignite&scope_granted=&req_refresh=1'
				},
				jar: cookieJar
			},
			function(err, response) {
				if(err) {
					return cb(err, null)
				}

				if(response.statusCode !== 302) {
					if(response.statusCode === 200) {
						return cb('Invalid Account Data!', null)
					} else if(response.statusCode === 503) {
						return cb('503 Response. AeriaGames Login is down again. Try again.', null)
					} else {
						return cb('Unknown StatusCode ' + response.statusCode + ' for login', null)
					}
				}

				location = response.caseless.dict.location
				if(location === '/dialog/oauth/missing_params?theme=api_ag') {
					return cb('Unknown Login Response got.', null)
				}

				if(!location) {
					return cb(null, null)
				}

				return cb(err, location)
			})
		},
		function(location, cb) {
			request.post({
				url: location,
				headers: {
					'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729); Ignite/Windows 1.13.3296'
				},
				jar: cookieJar
			},
			function(err, response) {
				if(err) {
					return cb(err, null)
				}

				if(response.statusCode === 302) {
					// Login success
				} else if(response.statusCode === 200) {
					// Authorizing
				} else {
					return cb('Unknown StatusCode ' + response.statusCode + ' for Auth', null)
				}

				try {
					params = response.caseless.dict.location.match(/login_success#.*/) + ''
					params = params.replace('login_success#', '')
					params = querystring.parse(params)
					return cb(false, params.access_token)
				} catch(err) {
					//console.log('Authorizing...')
					var authorizeHtml = cheerio.load(response.body)
					var url = authorizeHtml('#buttons a').attr('href')

					request.get({
						url: url,
						headers: {
							'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729); Ignite/Windows 1.13.3296'
						},
						jar: cookieJar
					},
					function(err, response) {
						if(err) {
							return callback(err, null)
						}

						if(response.statusCode === 200) {
							return cb('Authorized. Please restart.', false)
						} else {
							return cb('Unknown Response Code: ' + response.statusCode, false)
						}
					})
				}
			})
		},
		function(accessToken, cb) {
			request.post({
				url: gameEventUrl,
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:49.0) Gecko/20100101 Firefox/49.0',
					'Referer': 'http://s4league.aeriagames.com/itemmall/free-rewards',
					'X-Requested-With': 'XMLHttpRequest',
					'X-Request': 'JSON'
				},
				gzip: true
			},
			function(err, response, body) {
				if(err) {
					return cb(err, null)
				}

				if(response.statusCode !== 200) {
					return cb('[ERROR] Failed to retrieve the Event ID.', false)
				}

				var result = JSON.parse(body)
				var eventId = result.event_id

				return cb(null, eventId, accessToken)
			})
		},
		function(eventId, accessToken, cb) {
			request.post({
				url: 'https://www.aeriagames.com/weblet/lootbox/' + gameNameRest + '/rest/play/' + eventId + '?access_token=' + accessToken,
				headers: {
					'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729); Ignite/Windows 1.13.3296'
				},
				jar: cookieJar,
				gzip: true
			},
			function(err, response, body) {
				if(err) {
					return cb(err, null)
				}

				var result = JSON.parse(body)
				if(result.error_code) {
					if(result.error_code === 102) {
						return cb('[ERROR] Event is deactivated. You might restart LootRedeem or check if there is a new version available.', false)
					} else if(result.error_code === 103) {
						return cb('[ERROR] Event doesn\'t exist.', false)
					} else if(result.error_code === 201) {
						console.log('[ERROR] You already redeemed. Please wait longer!')
						return cb(result.message, eventId, accessToken)
					} else {
						return cb('[ERROR] Unknown Error Code: ' + result.error_code, false)
					}
				} else if(result.is_successful) {
					return cb(false, eventId, accessToken)
				} else {
					console.log('[ERROR] Unknown response:')
					return cb(result, false)
				}
			})
		},
		function(eventId, accessToken, cb) {
			request.post({
				url: 'https://www.aeriagames.com/weblet/lootbox/' + gameNameRest + '/rest/redeem/' + eventId + '?access_token=' + accessToken,
				headers: {
					'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729); Ignite/Windows 1.13.3296'
				},
				jar: cookieJar,
				gzip: true
			},
			function(err, response, body) {
				if(err) {
					return cb(err, null)
				}

				var result = JSON.parse(body)
				if(result.error_code) {
					if(result.error_code === 108) {
						console.log('[ERROR] Nothing to redeem.')
						return cb(result.message, eventId, accessToken)
					} else {
						return cb('[ERROR] Unknown Error Code: ' + result.error_code, false)
					}
				} else if(result.prize) {
					console.log('[SUCCESS] ' + result.prize.name + ' x' + result.prize.qty)
					return cb(false, false)
				} else {
					console.log('[ERROR] Unknown response:')
					return cb(result, false)
				}
			})
		}
	], function(err, eventId, accessToken) {
		if(err) {
			console.log(err)
		}

		if(accessToken) {
			request.get({
				url: 'https://www.aeriagames.com/weblet/lootbox/' + gameNameRest + '/rest/event/' + eventId + '?access_token=' + accessToken,
				headers: {
					'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.2; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729); Ignite/Windows 1.13.3296'
				},
				jar: cookieJar,
				gzip: true
			},
			function(err, response, body) {
				if(err) {
					return cb(err, null)
				}

				var result = JSON.parse(body)
				if(result.won_item) {
					console.log('Last Won item: ' + result.won_item.name + ' x' + result.won_item.qty)
				}
				var waitTime = result.period / 60 / 60
				console.log('You can redeem all ' + waitTime + ' hours.')
				console.log('You can redeem in ' + secondsToHms(result.total_seconds) + ' again!')

				return cb(err)
			})
		} else {
			return cb(err)
		}
	})
}

function manageAccounts() {
	console.log('####################')
	console.log('##### ACCOUNTS #####')
	console.log('####################')

	var accounts = ini.parse(fs.readFileSync(configFilePath, 'utf-8'))
	for (var key in accounts) {
		var account = accounts[key]
		console.log('Username: ' + account.username)
	}

	console.log('[1] Add Account')
	console.log('[2] Delete Account')
	console.log('[3] Back to Main Menu')

	prompt.start()
	prompt.get(['option'], function (err, result) {
		prompt.pause()
		if(err) {
			return
		}

		if(result.option === '1') {
			addAccount()
		} else if(result.option === '2') {
			deleteAccount()
		} else if(result.option === '3') {
			main()
		} else {
			manageAccounts()
		}
	})
}

function addAccount() {
	console.log('#######################')
	console.log('##### ADD ACCOUNT #####')
	console.log('#######################')

	var options = {
		properties: {
			username: {

			},
			password: {
				hidden: true
			}
		}
	}

	prompt.start()
	prompt.get(options, function (err, result) {
		prompt.pause()
		if(err) {
			return
		}

		var newAccounts = []

		var accounts = ini.parse(fs.readFileSync(configFilePath, 'utf-8'))
		for (var key in accounts) {
			var account = accounts[key]
			newAccounts.push({
				username: account.username,
				password: account.password
			})
		}

		newAccounts.push({
			username: result.username,
			password: result.password
		})

		fs.writeFileSync(configFilePath, ini.encode(newAccounts))

		manageAccounts()
	})
}

function deleteAccount() {
	console.log('##########################')
	console.log('##### DELETE ACCOUNT #####')
	console.log('##########################')

	var accountsArray = []
	var accounts = ini.parse(fs.readFileSync(configFilePath, 'utf-8'))
	for (var key in accounts) {
		var account = accounts[key]
		console.log('[' + (parseInt(key) + 1) + '] Username: ' + account.username)
		accountsArray.push({
			username: account.username,
			password: account.password
		})
	}

	if(key) {
		var exitNumber = parseInt(key) + 2
	} else {
		var exitNumber = 1
	}

	console.log('--------------------')
	console.log('[' + exitNumber + '] Back to Accounts')

	prompt.start()
	prompt.get(['option'], function (err, result) {
		prompt.pause()
		if(err) {
			return
		}

		if(result.option === exitNumber + '') {
			manageAccounts()
			return
		}

		var index = parseInt(result.option) - 1

		if(accountsArray.length < index || index === -1) {
			console.log('Invalid Number!')
			deleteAccount()
			return
		}

		delete accountsArray[index]

		fs.writeFileSync(configFilePath, ini.encode(accountsArray))

		console.log('Account successfully deleted!')
		deleteAccount()
	})
}

function changeGame() {
	console.log('#######################')
	console.log('##### CHANGE GAME #####')
	console.log('#######################')

	for (var i = 0; i < games.length; i++) {
		console.log('[' + (i + 1) + '] ' + games[i].name)
	}

	var exitNumber = games.length + 1

	console.log('[' + exitNumber + '] Back to Main Menu')

	prompt.start()
	prompt.get(['option'], function (err, result) {
		prompt.pause()
		if(err) {
			return
		}

		if(result.option === exitNumber + '') {
			main()
			return
		}

		var index = parseInt(result.option) - 1

		if((games.length - 1) < index || index === -1) {
			console.log('Invalid Number!')
			changeGame()
			return
		}

		setGame(index)

		main()
	})
}

function setGame(index) {
	for (var i = 0; i < games.length; i++) {
		if(i === index) {
			gameEventUrl = games[i].eventUrl
			gameName = games[i].name
			gameNameRest = games[i].key

			console.log('Changed Game to ' + gameName)
			return
		}
	}
}

function secondsToHms(d) {
	d = Number(d)
	var h = Math.floor(d / 3600)
	var m = Math.floor(d % 3600 / 60)
	var s = Math.floor(d % 3600 % 60)
	return ((h > 0 ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s)
}

init()
