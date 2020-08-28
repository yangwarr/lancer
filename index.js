const path = require('path')
const fs = require('fs')
const { count } = require('console')

const JOB_LANCER = 1

const SKILL_COMBO_1 = 11200
const SKILL_COMBO_1_LENGTH = 650
const SKILL_COMBO_2 = 11201
const SKILL_COMBO_2_LENGTH = 1000
const SKILL_COMBO_3 = 11202
const SKILL_COMBO_3_LENGTH = 1800

const SKILL_ONSLAUGHT = 30200
const SKILL_ONSLAUGHT_LENGTH = 3595

const SKILL_BASH = 50100
const SKILL_BASH_EX = 50101
const SKILL_BASH_EX_2 = 50102
const SKILL_BASH_LENGTH = 825

const SKILL_COUNTER = 81100
const SKILL_COUNTER_LENGTH = 1440

const SKILL_DEBILITATE = 100300
const SKILL_DEBILITATE_LENGTH = 920

const SKILL_SPRING = 131100
const SKILL_SPRING_LENGTH = 2790

const SKILL_CHARGING = 151000
const SKILL_CHARGING_LENGTH = 1100
const SKILL_CHARGING_2 = 151001
const SKILL_CHARGING_2_LENGTH = 930

const SKILL_BARRAGE_1 = 181100
const SKILL_BARRAGE_1_LENGTH = 600
const SKILL_BARRAGE_2 = 181101
const SKILL_BARRAGE_2_LENGTH = 790

const SKILL_LOCKDOWN = 210401
const SKILL_LOCKDOWN_2 = 210402
const SKILL_LOCKDOWN_LENGTH = 1390

const SKILL_WALLOP = 251000
const SKILL_WALLOP_LENGTH = 2380

const SKILL_LEAP = 280100
const SKILL_LEAP_2 = 280101
const SKILL_LEAP_LENGTH = 4495

const SKILL_BACKSTEP = 260100

const SKILL_CHALLENGE = 40900
const SKILL_CHALLENGE_LENGTH = 2190

const SKILL_INFURIATE = 120100
const SKILL_INFURIATE_LENGTH = 2430

const SKILL_ADRENALINE_RUSH = 170200;
	
const SPRING_CHAINS = [SKILL_DEBILITATE, SKILL_COMBO_3, SKILL_LOCKDOWN,SKILL_LOCKDOWN_2, SKILL_BARRAGE_1, SKILL_BARRAGE_2, SKILL_BASH, SKILL_COUNTER]
const WALLOP_CHAINS = [SKILL_SPRING, SKILL_DEBILITATE, SKILL_LOCKDOWN,SKILL_LOCKDOWN_2, SKILL_BARRAGE_1, SKILL_BARRAGE_2, SKILL_CHARGING, SKILL_COUNTER]
const ONSLAUGHT_CHAINS = [SKILL_BARRAGE_1, SKILL_BARRAGE_2, SKILL_BASH,SKILL_BASH_EX,SKILL_BASH_EX_2, SKILL_COMBO_1, SKILL_COMBO_2, SKILL_COMBO_3]

const SettingsUI = require('tera-mod-ui').Settings;

module.exports = function LanceMeOniisama(mod) {
	const {command} = mod

	let config = getConfig()

	function jsonRequire(data) {
		delete require.cache[require.resolve(data)]
		return require(data)
	}
	
	function jsonSave(name, data) {fs.writeFile(path.join(__dirname, name), JSON.stringify(data, null, 4), err => {})}
	
	function getConfig() {
		let data = {}
		try {
			data = jsonRequire('./config.json')
		} catch (e) {
			data = {
				LEAP_AUTOCOUNTER: true,
				WALLOP_AUTOCOUNTER: true,
				ONSLAUGHT_AUTOCOUNTER: true,
				AUTO_SPRING_AFTER_BARRAGE: true,
				AUTO_SPRING_AFTER_OS_ARUSH_ONLY: true,
				AUTO_SPRING_AFTER_DEBILITATE: true,
				CHARGE_AUTO_LEAP: true,
				AUTO_LEAP_AFTER_WALLOP_ONLY_DURING_ARUSH: true,
				AUTO_LEAP_AFTER_CHARGE_ONLY_DURING_ARUSH: true,
				AUTO_WALLOP_AFTER_SPRING: true,
				AUTO_WALLOP_AFTER_LOCKDOWN: true,
				AUTO_ONSLAUGHT_AFTER_SHIELD_BASH: true,
				AUTO_BLOCK_CANCEL_SPRING_IF_WALLOP_ON_CD: true,
				AUTO_LOCKDOWN_AFTER_SPRING_IF_WALLOP_ON_CD: true,
				AUTO_ONSLAUGHT_AFTER_BARRAGE_IF_SPRING_ON_CD: true,
				AUTO_SHIELD_COUNTER_AFTER_BLOCK: true,
				AUTO_BLOCK_CANCEL_COMBO_ATTACK1: true,
				AUTO_BLOCK_CANCEL_COMBO_ATTACK2: true,
				AUTO_BLOCK_CANCEL_COMBO_ATTACK3: true,
				SPRING_LOCK_DURATION: 800,
				BARRAGECANCEL_DELAY: 250,
				BARRAGE2CANCEL_DELAY: 360,
				DEBCANCEL_DELAY: 550,
				BASHCANCEL_DELAY: 550,
				SPRINGCANCEL_DELAY: 900,
				WALLOPCANCEL_DELAY: 1200,
				COUNTERCANCEL_DELAY: 900,
				CHARGINGCANCEL_DELAY: 900,
				LOCKDOWNCANCEL_DELAY: 1000,
				SHOUTCANCEL_DELAY: 1260,
				ENRAGECANCEL_DELAY: 1440,
				BLOCK_KEY: 'B'
			}
			jsonSave('config.json', data)
		}
		return data
	}
	
	let BLOCK_KEY = 'B';
	if (("BLOCK_KEY" in config)) {
		BLOCK_KEY = config.BLOCK_KEY;
	}

	let enabled = true
	
	let job
	let aspd
	let xLoc
	let yLoc
	let zLoc
	let wLoc
	let atkid = []
	let atkid_base = 0xFEFEFFEE
	let disabSkill = []
	let cdSkill = []
	let unlockAll = false
	let cancelState = false
	let lastSkill
	let lastEvent
	let blockTimer
	let lockState
	let lockTimer
	let onsLock
	let springLock
	let wallopLock
	let blockActive
	let instantBlockActive
	let bashGlyph
	let counterPoint = 0
	let castTime
	let GLOBAL_LOCK_DELAY = 1000
	let finish = []
	let finishcheck = []
	let glyphState = []
	let talentState = []
	let polishState = []
	let counterActive = 0
	let sub = 0
	let aRushActive = false
	let shieldCounterCount = 0
	let onslaughtCount = 0
	let springCount = 0
	let autoOneCount = 0
	let autoTwoCount = 0
	let autoThreeCount = 0
	let autoLock = false
	let autoLock2 = false
	let autoLock3 = false
	let SKILL_BLOCK = 20200
	let ui = null;

	command.add('lancer', {
		reload() {
			config = getConfig()
			command.message(`Config has been reloaded.`)
		},
		config() {
			if(ui) {
				ui.show();
			}
		},
		$default() { command.message(`Lancer script: ${(enabled = !enabled) ? 'en' : 'dis'}abled.`) }
	})
	
	mod.hook('S_LOGIN', 14, event => {
		job = (mod.game.me.templateId - 10101) % 100
		enabled = [JOB_LANCER].includes(job)
	})
	
	mod.hook('S_LOAD_EP_INFO', 2, event => {
		if (!enabled) return
		
		talentState = []
		event.perks.forEach(function(element) {
			talentState[element.id] = element.level
		})
	})

	mod.hook('S_LEARN_EP_PERK', 1, event => {
		if (!enabled) return
		talentState = []
		event.perks.forEach(function(element) {
			talentState[element.id] = element.level
		})
	})
	
	mod.hook('S_RP_SKILL_POLISHING_LIST', 1, (event) => {
		if (!enabled) return
		event.optionEffects.forEach(function(element) {
			polishState[element.id] = element.active
		})
		SKILL_BLOCK = 20200;
		try {
			event.optionEffects.forEach(function(element) {
				if(element.id == 17020201 && element.active){
					SKILL_BLOCK =20230;
				}
				if(element.id == 17020202 && element.active){
           	     SKILL_BLOCK =20240;
          		}
			});
		}
		catch (e) { }
	})

	mod.hook('S_CREST_INFO', 2, event => {
		if (!enabled) return
		
		event.crests.forEach(function(element) {
			glyphState[element.id] = element.enable
		})
	})

	mod.hook('S_CREST_APPLY', 2, event => {
		if (!enabled) return
		
		glyphState[event.id] = event.enable2
	})
	
	mod.hook('S_EACH_SKILL_RESULT', 14, event => {
		if (!enabled) return
		
		if (mod.game.me.is(event.target) && event.reaction.enable)
			lastSkill = 1
	})
	
	mod.hook('S_PLAYER_STAT_UPDATE', 14, (event) => {
		if (!enabled) return
		
		aspd = (event.attackSpeed + event.attackSpeedBonus) / 100
	})

	mod.hook('S_SYSTEM_MESSAGE', 1, (event) => {
		if (!enabled) { return };
		if(event.message == '@1677') { // removes 'you can only use this skill after defending'
			return false;
		}
	  });
	
	mod.hook('S_START_COOLTIME_SKILL', 3, event => {
		if (!enabled) return
		if (cdSkill[event.skill.id] == 'undefined') cdSkill[event.skill.id] = false
		cdSkill[event.skill.id] = true
		mod.setTimeout(function(event) { cdSkill[event.skill.id] = false }, event.cooldown, event)
	})
	
	mod.hook('S_DEFEND_SUCCESS', 3, event => {
		if (!enabled) return
		if(!mod.game.me.is(event.gameId)) return
		counterActive = 1
		if(lastSkill == 20200) {
			if((event.skill.id == 1101 || event.skill.id == 1102 || event.skill.id == 1103) && config.AUTO_SHIELD_COUNTER_AFTER_BLOCK) {
				for(var i = 0; i < 5; i++) {
					setTimeout(() => {
						mod.toServer('C_START_SKILL', 7, {
							skill: SKILL_COUNTER,
							w: wLoc,
							loc: { x: xLoc, y: yLoc, z: zLoc },
							dest: { x: 0, y: 0, z: 0 },
							unk: true,
							moving: false,
							continue: false,
							target: 0n,
							unk2: false
						})
					},i*25)
				}
				counterActive = 0
			}
		}
	})
	
	mod.hook('C_PRESS_SKILL', 4, { order: -200, filter: {fake: null} }, event => {
		if (!enabled) return
		if (event.skill.id == SKILL_BLOCK && event.press == false) {
			counterActive = 0
			clearTimeout(blockTimer)
			blockTimer = mod.setTimeout(() => { blockActive = 0 }, 500)
			instantBlockActive = 0

			if (finish[SKILL_COUNTER] != false) {
				mod.toClient('S_ACTION_END', 5, {
				  gameId: mod.game.me.gameId,
				  loc: {
					x: xLoc || event.loc.x,
					y: yLoc || event.loc.y,
					z: zLoc || event.loc.z
				  },
				  w: wLoc || event.w,
				  templateId: mod.game.me.templateId,
				  skill: event.skill.id,
				  type: 10,
				  id: atkid[event.skill.id],
				});
			  }
		}

		if (event.skill.id == SKILL_BLOCK && event.press == true) {
			clearTimeout(lockTimer)
			clearTimeout(blockTimer)
			lockState = false
			blockActive = 1
			instantBlockActive = 1

			blockTimer = setTimeout(function (event) {
				mod.toClient('S_ACTION_STAGE', 9, {
				  gameId: mod.game.me.gameId,
				  loc: {
					x: event.loc.x,
					y: event.loc.y,
					z: event.loc.z
				  },
				  w: event.w,
				  templateId: mod.game.me.templateId,
				  skill: event.skill.id,
				  stage: 1,
				  speed: 1,
				  ...(mod.majorPatchVersion >= 75 ? { projectileSpeed: 1 } : 0n),
				  id: atkid[event.skill.id],
				  effectScale: 1.0,
				  moving: false,
				  dest: { x: 0, y: 0, Z: 0 },
				  target: 0n,
				  animSeq: [],
				});
			  }, 350, event);
		}
		if (event.press == true) {
			lastSkill = event.skill.id
			lastEvent = event
		}
	})
	
	mod.hook('C_START_SKILL', 7, { order: Number.NEGATIVE_INFINITY, filter: {fake: null} }, event => {
		if (!enabled) return
		xLoc = event.loc.x
		yLoc = event.loc.y
		zLoc = event.loc.z
		wLoc = event.w
		if (disabSkill[event.skill.id] == 'undefined') disabSkill[event.skill.id] = false
		if (event.skill.id != SKILL_BACKSTEP && lockState) return false
		let allowCancel = false
		if (!disabSkill[event.skill.id] || (unlockAll && event.skill.id != lastSkill)) {
			unlockAll = false
			if (lastSkill == SKILL_BARRAGE_2 && event.skill.id != SKILL_SPRING && event.skill.id != SKILL_WALLOP && event.skill.id != SKILL_DEBILITATE && event.skill.id != SKILL_ONSLAUGHT && event.skill.id != SKILL_LOCKDOWN && cancelState) allowCancel = true
			if (lastSkill == SKILL_SPRING && event.skill.id != SKILL_WALLOP) allowCancel = true
			if (lastSkill == SKILL_DEBILITATE && event.skill.id != SKILL_SPRING && event.skill.id != SKILL_BASH && event.skill.id != SKILL_WALLOP && event.skill.id != SKILL_LOCKDOWN && cancelState) allowCancel = true
			if (lastSkill == SKILL_BASH && event.skill.id != SKILL_SPRING && event.skill.id != SKILL_ONSLAUGHT && cancelState) allowCancel = true
			if (lastSkill == SKILL_COUNTER && event.skill.id != SKILL_SPRING && event.skill.id != SKILL_WALLOP && cancelState) allowCancel = true
			if (lastSkill == SKILL_WALLOP && (event.skill.id != SKILL_COUNTER || event.skill.id == SKILL_COUNTER && counterActive == 0) && event.skill.id != SKILL_LEAP && cancelState) allowCancel = true
			if (lastSkill == SKILL_CHALLENGE && cancelState) allowCancel = true
			if (lastSkill == SKILL_INFURIATE && cancelState) allowCancel = true
			if (lastSkill == SKILL_LOCKDOWN  && cancelState) allowCancel = true
			if (lastSkill == SKILL_CHARGING) allowCancel = false

			if (allowCancel == true) {
				cancelState = false
				disabSkill = []
				mod.toServer('C_PRESS_SKILL', 4, {
					skill: SKILL_BLOCK,
					press: true,
					loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z },
					w: event.w,
				})
				mod.toServer('C_PRESS_SKILL', 4, {
					skill: SKILL_BLOCK,
					press: false,
					loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z },
					w: event.w,
				})
			}
			if (event.skill.id == SKILL_CHALLENGE) {
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_CHALLENGE] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_CHALLENGE_LENGTH)
				if (config.SHOUTCANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.SHOUTCANCEL_DELAY / aspd, event)
				}
			}
			if (event.skill.id == SKILL_INFURIATE) {
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_INFURIATE] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_INFURIATE_LENGTH)
				if (config.ENRAGECANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.ENRAGECANCEL_DELAY / aspd, event)
				}
			}
			if (event.skill.id == SKILL_BARRAGE_1) {
				disabSkill[SKILL_SPRING] = false
				disabSkill[SKILL_WALLOP] = false
				disabSkill[SKILL_ONSLAUGHT] = false
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_BARRAGE_1] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_BARRAGE_1_LENGTH)
				if (config.BARRAGECANCEL_DELAY > 0) {
					mod.setTimeout(function (event) {
						mod.toServer('C_PRESS_SKILL', 4, {
							skill: SKILL_BLOCK,
							press: true,
							loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z },
							w: event.w
						})
						mod.toServer('C_PRESS_SKILL', 4, {
							skill: SKILL_BLOCK,
							press: false,
							loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z },
							w: event.w,
						})
						mod.toServer('C_START_SKILL', 7, {
							skill: SKILL_BARRAGE_2,
							w: event.w,
							loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z },
							dest: { x: event.dest.x, y: event.dest.y, z: event.dest.z },
							unk: event.unk,
							moving: event.moving,
							continue: event.continue,
							target: event.target,
							unk2: event.unk2,
						})
					}, config.BARRAGECANCEL_DELAY / aspd, event);
				}
			}
			if (event.skill.id == SKILL_BARRAGE_2) {
				disabSkill[SKILL_SPRING] = false
				disabSkill[SKILL_WALLOP] = false
				disabSkill[SKILL_ONSLAUGHT] = false
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_BARRAGE_2_LENGTH] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_BARRAGE_2_LENGTH)
				if (config.BARRAGE2CANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.BARRAGE2CANCEL_DELAY / aspd, event)
				}
			}
			if (event.skill.id == SKILL_DEBILITATE) {
				disabSkill[SKILL_SPRING] = false
				disabSkill[SKILL_WALLOP] = false
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_DEBILITATE] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_DEBILITATE_LENGTH)
				if (config.DEBCANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.DEBCANCEL_DELAY / aspd, event)
				}
			}
			if (event.skill.id == SKILL_COUNTER) {
				disabSkill[SKILL_SPRING] = false
				disabSkill[SKILL_WALLOP] = false
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_COUNTER] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_COUNTER_LENGTH)
				if (config.COUNTERCANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.COUNTERCANCEL_DELAY / aspd, event)
				}
			}
			if (event.skill.id == SKILL_BASH_EX || event.skill.id == SKILL_BASH_EX_2) {
				if (glyphState[22035]) {
					bashGlyph = true
					mod.setTimeout(function() { bashGlyph = false }, 5000)
				}
				disabSkill[SKILL_ONSLAUGHT] = false
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() {
					disabSkill[SKILL_BASH_EX] = false
					disabSkill[SKILL_BASH_EX_2] = false
				}, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_BASH_LENGTH)
				if (config.BASHCANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.BASHCANCEL_DELAY / aspd, event)
				}
			}
			if (event.skill.id == SKILL_SPRING) {
				if (config.SPRING_LOCK_DURATION > 0) {
					clearTimeout(lockTimer)
					lockState = true
					lockTimer = mod.setTimeout(function() { lockState = false }, config.SPRING_LOCK_DURATION / aspd)
				}
				disabSkill[SKILL_WALLOP] = false
				disabSkill[event.skill.id] = true
				springLock = mod.setTimeout(function() { disabSkill[SKILL_SPRING] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_SPRING_LENGTH)
				if (config.SPRINGCANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.SPRINGCANCEL_DELAY / aspd, event)
				}
			}
			if (event.skill.id == SKILL_WALLOP) {
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_WALLOP] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_WALLOP_LENGTH)
				if (config.WALLOPCANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.WALLOPCANCEL_DELAY / aspd, event)
				}
			}
			if (event.skill.id == SKILL_ONSLAUGHT) {
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_ONSLAUGHT] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_ONSLAUGHT_LENGTH)
			}

			if(event.skill.id == SKILL_LOCKDOWN) {
				disabSkill[event.skill.id] = true
				let timer = mod.setTimeout(function() { disabSkill[SKILL_WALLOP] = false }, GLOBAL_LOCK_DELAY)
				skillCheck(event, SKILL_LOCKDOWN_LENGTH)
				if (config.LOCKDOWNCANCEL_DELAY > 0) {
					cancelState = true
					mod.setTimeout(function(event) {
						forceEnd(event, 10)
						unlockAll = true
					}, config.LOCKDOWNCANCEL_DELAY / aspd, event)
				}
			}
		}
		lastSkill = event.skill.id
		lastEvent = event
	})
	
	mod.hook('C_START_TARGETED_SKILL', 7, { order: -200, filter: { fake: null } }, event => {
		if (!enabled) return
		
		if (disabSkill[event.skill.id] == 'undefined') disabSkill[event.skill.id] = false
		if (lockState) return false
		let allowCancel = false
		if (!disabSkill[event.skill.id] || (unlockAll && event.skill.id != lastSkill)) {
			unlockAll = false
			if (cancelState) allowCancel = true
			if (allowCancel == true) {
				cancelState = false
				mod.toServer('C_PRESS_SKILL', 4, {
					skill: SKILL_BLOCK,
					press: true,
					loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z },
					w: event.w,
				})
				mod.toServer('C_PRESS_SKILL', 4, {
					skill: SKILL_BLOCK,
					press: false,
					loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z },
					w: event.w,
				})
			}
		}
		lastSkill = event.skill.id
		lastEvent = event
	})

	mod.hook('S_EACH_SKILL_RESULT',14, (event) => {
		if(!enabled) return
		if (event.source === mod.game.me.gameId) {
			if(event.skill.id == SKILL_BARRAGE_2 && config.AUTO_SPRING_AFTER_BARRAGE) {
				mod.toServer('C_START_SKILL', 7, {
					skill: SKILL_SPRING,
					w: wLoc,
					loc: { x: xLoc, y: yLoc, z: zLoc },
					dest: { x: 0, y: 0, z: 0 },
					unk: true,
					moving: false,
					continue: false,
					target: 0n,
					unk2: false
				})
			}

			if(event.skill.id == SKILL_CHARGING_2 && config.CHARGE_AUTO_LEAP) {
				if(!config.AUTO_LEAP_AFTER_CHARGE_ONLY_DURING_ARUSH) {
					for(var i = 0; i < 5; i++) {
						setTimeout(() => {
							mod.toServer('C_START_SKILL', 7, {
								skill: SKILL_LEAP,
								w: wLoc,
								loc: { x: xLoc, y: yLoc, z: zLoc },
								dest: { x: 0, y: 0, z: 0 },
								unk: true,
								moving: false,
								continue: false,
								target: 0n,
								unk2: false
							})
						},i*25)
					}
				}
				else if(config.AUTO_LEAP_AFTER_CHARGE_ONLY_DURING_ARUSH && aRushActive) {
					for(var i = 0; i < 5; i++) {
						setTimeout(() => {
							mod.toServer('C_START_SKILL', 7, {
								skill: SKILL_LEAP,
								w: wLoc,
								loc: { x: xLoc, y: yLoc, z: zLoc },
								dest: { x: 0, y: 0, z: 0 },
								unk: true,
								moving: false,
								continue: false,
								target: 0n,
								unk2: false
							})
						},i*25)
					}
				}
	//			if(config.AUTO_LEAP_AFTER_CHARGE_ONLY_DURING_ARUSH && !aRushActive) return;
			}

			if((event.skill.id == SKILL_WALLOP || event.skill.id == SKILL_WALLOP + 30)) {
				if(cdSkill[SKILL_LEAP] && config.WALLOP_AUTOCOUNTER) {
					for(var i = 0; i < 5; i++) {
						setTimeout(() => {
							mod.toServer('C_START_SKILL', 7, {
								skill: SKILL_COUNTER,
								w: wLoc,
								loc: { x: xLoc, y: yLoc, z: zLoc },
								dest: { x: 0, y: 0, z: 0 },
								unk: true,
								moving: false,
								continue: false,
								target: 0n,
								unk2: false
							})
						},i*25)
					}
				}
				if(config.AUTO_LEAP_AFTER_WALLOP_ONLY_DURING_ARUSH && !aRushActive) { return; }
				mod.toServer('C_START_SKILL', 7, {
					skill: SKILL_LEAP,
					w: wLoc,
					loc: { x: xLoc, y: yLoc, z: zLoc },
					dest: { x: 0, y: 0, z: 0 },
					unk: true,
					moving: false,
					continue: false,
					target: 0n,
					unk2: false
				})
			}

			if(event.skill.id == SKILL_COUNTER) {
				if(config.AUTO_SPRING_AFTER_OS_ARUSH_ONLY && !aRushActive) { return;}
				shieldCounterCount++;
				onslaughtCount = 0;
				if(shieldCounterCount % 2 == 0) {
					mod.toServer('C_START_SKILL', 7, {
						skill: SKILL_SPRING,
						w: wLoc,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						dest: { x: 0, y: 0, z: 0 },
						unk: true,
						moving: false,
						continue: false,
						target: 0n,
						unk2: false
					})
				}
			}

			if(event.skill.id == SKILL_BASH_EX) {
				if(!config.AUTO_ONSLAUGHT_AFTER_SHIELD_BASH) {return;}
				mod.toServer('C_START_SKILL', 7, {
					skill: SKILL_ONSLAUGHT,
					w: wLoc,
					loc: { x: xLoc, y: yLoc, z: zLoc },
					dest: { x: 0, y: 0, z: 0 },
					unk: true,
					moving: false,
					continue: false,
					target: 0n,
					unk2: false
				})
			}

			if(event.skill.id == SKILL_ONSLAUGHT || event.skill.id == SKILL_ONSLAUGHT + 30) { // misses one hit from onslaught but wtv
				if(!config.ONSLAUGHT_AUTOCOUNTER) { return; }
				onslaughtCount++;
				if(onslaughtCount % 11 == 0) {
						for(var i = 0; i < 10; i++) {
							setTimeout(() => {
								mod.toServer('C_START_SKILL', 7, {
									skill: SKILL_COUNTER,
									w: wLoc,
									loc: { x: xLoc, y: yLoc, z: zLoc },
									dest: { x: 0, y: 0, z: 0 },
									unk: true,
									moving: false,
									continue: false,
									target: 0n,
									unk2: false
								})
							},(i*25)+25)
						}
				}
				if(onslaughtCount % 13 == 0) { onslaughtCount = 0 }
			}

			if(event.skill.id == SKILL_SPRING + 30) {
				if(!config.AUTO_WALLOP_AFTER_SPRING && !config.AUTO_LOCKDOWN_AFTER_SPRING_IF_WALLOP_ON_CD) { return; }
				springCount++;

				if(cdSkill[SKILL_WALLOP] && springCount % 3 == 0 && config.AUTO_LOCKDOWN_AFTER_SPRING_IF_WALLOP_ON_CD) {
					mod.toServer('C_START_SKILL', 7, {
						skill: SKILL_LOCKDOWN,
						w: wLoc,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						dest: { x: 0, y: 0, z: 0 },
						unk: true,
						moving: false,
						continue: false,
						target: 0n,
						unk2: false
					})
					setTimeout(() => {
						springCount=0;
					},200)
				}

				if(springCount % 3 == 0 && !cdSkill[SKILL_WALLOP] && config.AUTO_WALLOP_AFTER_SPRING) {
					mod.toServer('C_START_SKILL', 7, {
						skill: SKILL_WALLOP,
						w: wLoc,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						dest: { x: 0, y: 0, z: 0 },
						unk: true,
						moving: false,
						continue: false,
						target: 0n,
						unk2: false
					})
					setTimeout(() => {
						springCount=0;
					},200)
				}

				if(springCount % 3 == 0 && cdSkill[SKILL_WALLOP] && config.AUTO_BLOCK_CANCEL_SPRING_IF_WALLOP_ON_CD) {
					mod.toServer('C_PRESS_SKILL', 4, {
						skill: SKILL_BLOCK,
						press: true,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						w: wLoc,
					})
					mod.toServer('C_PRESS_SKILL', 4, {
						skill: SKILL_BLOCK,
						press: false,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						w: wLoc,
					})
					setTimeout(() => {
						springCount=0;
					},200)
				}

				if(springCount % 3 == 0) { 	setTimeout(() => { springCount=0;},150)}
			}

			if(event.skill.id == SKILL_DEBILITATE) {
				if(!config.AUTO_SPRING_AFTER_DEBILITATE) { return; }
				mod.toServer('C_START_SKILL', 7, {
					skill: SKILL_SPRING,
					w: wLoc,
					loc: { x: xLoc, y: yLoc, z: zLoc },
					dest: { x: 0, y: 0, z: 0 },
					unk: true,
					moving: false,
					continue: false,
					target: 0n,
					unk2: false
				})
			}

			if(event.skill.id == SKILL_LEAP_2) {
				if(config.LEAP_AUTOCOUNTER) {
					for(var i = 0; i < 5; i++) {
						setTimeout(() => {
							mod.toServer('C_START_SKILL', 7, {
								skill: SKILL_COUNTER,
								w: wLoc,
								loc: { x: xLoc, y: yLoc, z: zLoc },
								dest: { x: 0, y: 0, z: 0 },
								unk: true,
								moving: false,
								continue: false,
								target: 0n,
								unk2: false
							})
						}, (i*25));
					}
				}
				if(blockActive == 0) {
					var robot17 = require("robotjs");
					for(var i = 0; i < 4; i++) {
						setTimeout(() => {
							robot17.keyTap(BLOCK_KEY);
						}, 150 * i)
					}
				}
			}

			if(event.skill.id == (SKILL_ADRENALINE_RUSH + 40)) {
				aRushActive = true;
				setTimeout(() => {
					aRushActive = false;
				}, 30000);
			}

			if(event.skill.id == SKILL_LOCKDOWN || event.skill.id == SKILL_LOCKDOWN_2) {
				if(config.AUTO_WALLOP_AFTER_LOCKDOWN) {
					mod.toServer('C_START_SKILL', 7, {
						skill: SKILL_WALLOP,
						w: wLoc,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						dest: { x: 0, y: 0, z: 0 },
						unk: true,
						moving: false,
						continue: false,
						target: 0n,
						unk2: false
					})
				}
				else {
					var robot17 = require("robotjs");
					robot17.keyTap(BLOCK_KEY);
				}
			}

			if((event.skill.id == SKILL_BARRAGE_1 || event.skill.id == SKILL_BARRAGE_2) && config.AUTO_ONSLAUGHT_AFTER_BARRAGE_IF_SPRING_ON_CD) {
				if(cdSkill[SKILL_SPRING]) {
					var robot17 = require("robotjs");
					for(var i = 0; i < 5; i++) {
						setTimeout(() => {
							mod.toServer('C_START_SKILL', 7, {
								skill: SKILL_ONSLAUGHT,
								w: wLoc,
								loc: { x: xLoc, y: yLoc, z: zLoc },
								dest: { x: 0, y: 0, z: 0 },
								unk: true,
								moving: false,
								continue: false,
								target: 0n,
								unk2: false
							})
						}, i*3);
					}
				}
			}

			if(event.skill.id == SKILL_COMBO_1 && config.AUTO_BLOCK_CANCEL_COMBO_ATTACK1) {
				if(autoLock) return;
				autoOneCount++;
				if(autoOneCount % 3 == 0) {
					autoLock = true;
					mod.toServer('C_PRESS_SKILL', 4, {
						skill: SKILL_BLOCK,
						press: true,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						w: wLoc,
					})
					mod.toServer('C_PRESS_SKILL', 4, {
						skill: SKILL_BLOCK,
						press: false,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						w: wLoc,
					})
					autoOneCount = 0;
					setTimeout(() => {
						autoLock = false;
					},100);
				}
			}

			if(event.skill.id == SKILL_COMBO_2 && config.AUTO_BLOCK_CANCEL_COMBO_ATTACK2) {
				if(autoLock2) return;
				autoTwoCount++;
				if(autoTwoCount % 2 == 0) {
					autoLock2 = true;
					mod.toServer('C_PRESS_SKILL', 4, {
						skill: SKILL_BLOCK,
						press: true,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						w: wLoc,
					})
					mod.toServer('C_PRESS_SKILL', 4, {
						skill: SKILL_BLOCK,
						press: false,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						w: wLoc,
					})
					autoTwoCount = 0;
					setTimeout(() => {
						autoLock2 = false;
					},100);
				}
			}

			if(event.skill.id == SKILL_COMBO_3 && config.AUTO_BLOCK_CANCEL_COMBO_ATTACK3) {
				if(autoLock3) return;
				autoThreeCount++;
				if(autoThreeCount % 3 == 0) {
					autoLock3 = true;
					mod.toServer('C_PRESS_SKILL', 4, {
						skill: SKILL_BLOCK,
						press: true,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						w: wLoc,
					})
					mod.toServer('C_PRESS_SKILL', 4, {
						skill: SKILL_BLOCK,
						press: false,
						loc: { x: xLoc, y: yLoc, z: zLoc },
						w: wLoc,
					})
					autoThreeCount = 0;
					setTimeout(() => {
						autoLock3 = false;
					},100);
				}
			}

		}
	});
	
	function skillCheck(event, length) {
		sub = 0
		let speed = 1
	//	console.log('got: ' + event.skill.id + '|' + ' expected 30200');
		if (event.skill.id == SKILL_SPRING && SPRING_CHAINS.includes(lastSkill) && finish[lastSkill] == false) {
			sub = 30
			length = 1840
		}
		if (event.skill.id == SKILL_WALLOP && WALLOP_CHAINS.includes(lastSkill) && finish[lastSkill] == false) {
			sub = 30
			length = 1890
		}
		if (event.skill.id == SKILL_ONSLAUGHT && ONSLAUGHT_CHAINS.includes(lastSkill) && finish[lastSkill] == false) {
	//		console.log('inside skill check onslaught')
			sub = 30
			length = 2650
		}
		if (event.skill.id == SKILL_LEAP && (lastSkill == SKILL_WALLOP || lastSkill == SKILL_CHARGING) && finish[lastSkill] == false) sub = 1
		if (event.skill.id == SKILL_WALLOP) castTime = Date.now()
		if (event.skill.id == SKILL_ONSLAUGHT && bashGlyph) { 
			speed = speed * 1.25 
	//		console.log('os bash skill triggered');
		}
		if (event.skill.id == SKILL_ONSLAUGHT && talentState[820320]) {
			speed = speed + (talentState[820320] * 5 / 700 + 50 / 700)
	//		console.log('os talent skill triggered');
		}
		clearTimeout(finishcheck[event.skill.id])
		finish[event.skill.id] = false
		atkid[event.skill.id + sub] = atkid_base
		atkid_base--
		finishcheck[event.skill.id] = finishcheck[event.skill.id] = mod.setTimeout(function(event) { finish[event.skill.id] = true }, (length / (aspd * speed)), event)
	}
	
	function forceEnd(event, unkz) {
		mod.toClient('S_ACTION_END', 5, {
			gameId: mod.game.me.gameId,
			loc: { x: event.loc.x, y: event.loc.y, z: event.loc.z },
			w: event.w,
			templateId: mod.game.me.templateId,
			skill: event.skill.id + sub,
			type: unkz,
			id: atkid[event.skill.id + sub],
		})
	}
	
	mod.hook('S_ACTION_STAGE',9, { order: -200, filter: { fake: null } }, event => {
		if(!enabled) return;
		if(!mod.game.me.is(event.gameId)) return;
	})

	mod.hook('C_NOTIFY_LOCATION_IN_ACTION', 4, { order: -200, filter: { fake: null } }, (event) => {
		if(!enabled) return;
	})

	mod.hook('S_ACTION_END',5, { order: -200, filter: { fake: null } }, event => {
		if(!enabled) return;
		if(!mod.game.me.is(event.gameId)) return;
	})

	if (global.TeraProxy.GUIMode) {
        ui = new SettingsUI(mod, require('./settingsStructure'), config, {
            alwaysOnTop: true,
            width: 500,
            height: 325
        });
        ui.on('update', settings => {
			  config.LEAP_AUTOCOUNTER = config.LEAP_AUTOCOUNTER;
			  config.WALLOP_AUTOCOUNTER = config.WALLOP_AUTOCOUNTER;
			  config.ONSLAUGHT_AUTOCOUNTER = config.ONSLAUGHT_AUTOCOUNTER;
			  config.AUTO_SPRING_AFTER_BARRAGE = config.AUTO_SPRING_AFTER_BARRAGE;
			  config.AUTO_SPRING_AFTER_DEBILITATE = config.AUTO_SPRING_AFTER_DEBILITATE;
			  config.CHARGE_AUTO_LEAP = config.CHARGE_AUTO_LEAP;
			  config.AUTO_LEAP_AFTER_WALLOP_ONLY_DURING_ARUSH = config.AUTO_LEAP_AFTER_WALLOP_ONLY_DURING_ARUSH;
			  config.AUTO_LEAP_AFTER_CHARGE_ONLY_DURING_ARUSH = config.AUTO_LEAP_AFTER_CHARGE_ONLY_DURING_ARUSH;
			  config.AUTO_WALLOP_AFTER_SPRING = config.AUTO_WALLOP_AFTER_SPRING;
			  config.AUTO_WALLOP_AFTER_LOCKDOWN = config.AUTO_WALLOP_AFTER_LOCKDOWN;
			  config.AUTO_ONSLAUGHT_AFTER_SHIELD_BASH = config.AUTO_ONSLAUGHT_AFTER_SHIELD_BASH;
			  config.AUTO_BLOCK_CANCEL_SPRING_IF_WALLOP_ON_CD = config.AUTO_BLOCK_CANCEL_SPRING_IF_WALLOP_ON_CD;
			  config.AUTO_LOCKDOWN_AFTER_SPRING_IF_WALLOP_ON_CD = config.AUTO_LOCKDOWN_AFTER_SPRING_IF_WALLOP_ON_CD;
			  config.AUTO_SHIELD_COUNTER_AFTER_BLOCK = config.AUTO_SHIELD_COUNTER_AFTER_BLOCK;
			  config.AUTO_BLOCK_CANCEL_COMBO_ATTACK1 = config.AUTO_BLOCK_CANCEL_COMBO_ATTACK1;
			  config.AUTO_BLOCK_CANCEL_COMBO_ATTACK2 = config.AUTO_BLOCK_CANCEL_COMBO_ATTACK2;
			  config.AUTO_BLOCK_CANCEL_COMBO_ATTACK3 = config.AUTO_BLOCK_CANCEL_COMBO_ATTACK3

			  config = settings;
			  jsonSave('config.json', config)
        });
        this.destructor = () => {
            if (ui) {
                ui.close();
				ui = null;
            }
        };
    }

	this.saveState = () => {
        mod.command.message("Reloading mod. Please wait until it's finished reloading.");
        return {  
			enabled: true,
			job: 1,
			aspd: 1,
		};
	};

	this.loadState = (state) => {
		enabled = state.enabled;
		job = state.job;
		aspd = state.aspd;
	};

	this.destructor = function() {
		command.remove('lancer')
		delete require.cache[require.resolve('path')]
		delete require.cache[require.resolve('fs')]
	}
}