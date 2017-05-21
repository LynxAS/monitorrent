import Vuex from 'vuex'
import { play } from 'vue-play'
import delay from 'delay'
import SettingsTracker from '../../../src/components/Settings/SettingsTracker'

const trackers = [
    {name: 'tracker1.com', form: null},
    {
        name: 'tracker2.com',
        form: [
            {
                type: 'row',
                content: [{
                    type: 'text',
                    model: 'username',
                    label: 'Username',
                    flex: 50
                }, {
                    type: 'password',
                    model: 'password',
                    label: 'Password',
                    flex: 50
                }]
            }
        ]
    },
    {
        name: 'tracker3.com',
        form: [
            {
                type: 'row',
                content: [{
                    type: 'text',
                    model: 'username',
                    label: 'Username',
                    flex: 50
                }, {
                    type: 'password',
                    model: 'password',
                    label: 'Password',
                    flex: 50
                }]
            }
        ]
    },
    {
        name: 'tracker4.com',
        form: [
            {
                type: 'row',
                content: [{
                    type: 'text',
                    model: 'keypass',
                    label: 'Keypass',
                    flex: 100
                }]
            }
        ]
    },
    {
        name: 'tracker5.com',
        form: [
            {
                type: 'row',
                content: [
                    {
                        type: 'text',
                        model: 'username',
                        label: 'Username',
                        flex: 45
                    },
                    {
                        type: 'password',
                        model: 'password',
                        label: 'Password',
                        flex: 45
                    },
                    {
                        type: 'select',
                        model: 'default_quality',
                        label: 'Default Quality',
                        options: [
                            'SD',
                            '720p',
                            '1080p'
                        ],
                        flex: 10
                    }
                ]
            }
        ]
    }
]

const models = {
    'tracker1.com': null,
    'tracker2.com': null,
    'tracker3.com': {
        username: 'username'
    },
    'tracker4.com': {
        keypass: 'asdqwdasd123asdq123asd12'
    },
    'tracker5.com': {
        username: 'username',
        password: 'password',
        default_quality: '720p'
    }
}

const canCheckes = {
    'tracker4.com': false
}

const log = (msg) => log.log(msg)
log.log = () => {}

function createTrackers ({ loading, trackers, models, canCheckes, throwOnSave }) {
    return {
        state: {
            loading: true,
            saving: false,
            trackers: []
        },
        actions: {
            loadTrackers ({ commit }) {
                log('loadSettings')
                if (!loading) {
                    commit('SET_TRACKERS', trackers)
                }
            },
            loadTracker ({ commit, state }, tracker) {
                log(`loadTracker ${tracker}`)
                if (!loading && (!state.trackers || state.trackers.length === 0)) {
                    commit('SET_TRACKERS', trackers)
                }
                const canCheck = !canCheckes || !canCheckes.hasOwnProperty(tracker)
                commit('SET_TRACKER_MODEL', { tracker, model: models[tracker], canCheck })
            },
            async saveTracker ({ commit }, { tracker, settings }) {
                log(`start saveTracker(${tracker}, ${JSON.stringify(settings)})`)
                commit('SET_TRACKER_MODEL_SAVING', true)
                await delay(2000)
                if (throwOnSave) {
                    commit('SET_TRACKER_MODEL_SAVING', false)
                    log(`throw on saveTracker(${tracker}, ${JSON.stringify(settings)})`)
                    throw new Error(`Can't save`)
                }
                commit('SET_TRACKER_MODEL_SAVING', false)
                log(`end saveTracker(${tracker}, ${JSON.stringify(settings)})`)
            },
            checkTracker (_, tracker) {
                return {
                    status: true
                }
            }
        },
        mutations: {
            'SET_TRACKERS' (state, trackers) {
                state.loading = false
                state.trackers = trackers
            },
            'SET_TRACKER_MODEL' (state, { tracker, model, canCheck }) {
                const trackerIndex = state.trackers.findIndex(e => e.name === tracker)
                if (trackerIndex >= 0) {
                    state.trackers = [
                        ...state.trackers.slice(0, trackerIndex),
                        {...state.trackers[trackerIndex], model, canCheck},
                        ...state.trackers.slice(trackerIndex + 1)
                    ]
                }
            },
            'SET_TRACKER_MODEL_SAVING' (state, value) {
                state.saving = value
            }
        }
    }
}

function createStoreOptions (params) {
    return {
        state: {
            message: '',
            close: false
        },
        mutations: {
            'showMessage' (state, { message, close = false }) {
                state.message = message
                state.close = !!close
            },
            'clearMessage' (state) {
                state.message = ''
                state.close = false
            }
        },
        modules: {
            trackers: createTrackers(params)
        }
    }
}

const createStore = (params) => new Vuex.Store(createStoreOptions(params))

function createPlay ({tracker, ...params}) {
    return {
        store: createStore(params),
        computed: {
            ...Vuex.mapState({
                'message': state => state.message,
                'close': state => state.close
            })
        },
        watch: {
            message () {
                log(`message changed: ${this.message}, close = ${this.close}`)
                if (this.message) {
                    this.$refs.snackbar.open()
                }
            }
        },
        mounted () {
            this.$refs.snackbar.$on('close', () => this.clearMessage({message: ''}))
        },
        methods: {
            ...Vuex.mapMutations({
                'clearMessage': 'clearMessage'
            })
        },
        render: function (h) {
            log.log = this.$log
            return <md-whiteframe md-elevation="5" style="margin: auto; width: 1168px">
                    <SettingsTracker tracker={tracker}/>
                    <md-snackbar md-position='top right' ref='snackbar' md-duration='4000'>
                        <span>{this.message}</span>
                        {this.close && <md-button class="md-accent" md-theme="light-blue" nativeOnClick={this.$refs.snackbar.close}>Close</md-button>}
                    </md-snackbar>
                </md-whiteframe>
        }
    }
}

play(SettingsTracker)
    .add('loading', createPlay({loading: true, trackers: [], model: {}, tracker: 'tracker1.com'}))
    .add('tracker without settings', createPlay({loading: false, trackers, models, canCheckes, tracker: 'tracker1.com'}))
    .add('tracker with empty settings and error on save', createPlay({loading: false, trackers, models, canCheckes, tracker: 'tracker2.com', throwOnSave: new Error(`Can't save`)}))
    .add('tracker with settings', createPlay({loading: false, trackers, models, canCheckes, tracker: 'tracker3.com'}))
    .add('tracker without check', createPlay({loading: false, trackers, models, canCheckes, tracker: 'tracker4.com'}))
    .add('tracker quality select', createPlay({loading: false, trackers, models, canCheckes, tracker: 'tracker5.com'}))