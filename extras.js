module.exports = {
	confButtons: [
		{
			type: 2,
			style: 3,
			label: 'Confirm',
			emoji: '✅',
			custom_id: 'confirm'
		},
		{
			type: 2,
			style: 4,
			label: 'Cancel',
			emoji: '❌',
			custom_id: 'cancel'
		}
	],
	delButtons: [
		{
			type: 2,
			style: 4,
			label: 'Confirm',
			emoji: '✅',
			custom_id: 'confirm'
		},
		{
			type: 2,
			style: 2,
			label: 'Cancel',
			emoji: '❌',
			custom_id: 'cancel'
		}
	],
	clearButtons: [
		{
			type: 2,
			style: 4,
			label: 'Clear',
			emoji: '🗑️',
			custom_id: 'confirm'
		},
		{
			type: 2,
			style: 2,
			label: 'Cancel',
			emoji: '❌',
			custom_id: 'cancel'
		}
	],

	starterVars: {
		'$USER': {
			desc: 'Pings the user',
			repl: ({user}) => `<@${user.id}>`
		},
		'$GUILD': {
			desc: 'Inserts the guild name',
			repl: ({guild}) => `${guild.name}`
		}
	},

	ticketComponents: {
		closed: [
			{
				type: 2,
				style: 1,
				emoji: {name: '✏️'},
				label: "Edit ticket",
				custom_id: "edit",
				disabled: true
			},
			{
				type: 2,
				style: 3,
				emoji: {name: '🔓'},
				label: "Open ticket",
				custom_id: "open"
			},
			{
				type: 2,
				style: 2,
				emoji: {name: '📕'},
				label: "Archive ticket",
				custom_id: "archive"
			},
		],
		open: [
			{
				type: 2,
				style: 1,
				emoji: {name: '✏️'},
				label: "Edit ticket",
				custom_id: "edit"
			},
			{
				type: 2,
				style: 4,
				emoji: {name: '🔒'},
				label: "Close ticket",
				custom_id: "close"
			},
			{
				type: 2,
				style: 2,
				emoji: {name: '📕'},
				label: "Archive ticket",
				custom_id: "archive"
			},
		]
	}
}