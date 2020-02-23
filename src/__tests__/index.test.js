import EventEmitter from 'events';
import {create} from '../index';

const timeout = time => new Promise(resolve => setTimeout(resolve, time));

class EventSource {
    constructor(properties) {
        this.emitter = new EventEmitter();
        Object.assign(this, properties);
    }

    addEventListener(name, fn) {
        this.emitter.on(name, fn);
    }

    removeEventListener(name, fn) {
        this.emitter.off(name, fn);
    }

    emit(name) {
        this.emitter.emit(name);
    }
}

beforeEach(() => {
    global.document = new EventSource({
        visibilityState: 'visible',
        documentElement: new EventSource(),
        body: new EventSource(),
    });
    global.window = new EventSource({setTimeout, clearTimeout});
});

afterEach(() => {
    global.document = undefined;
    global.window = undefined;
});

test('will fire listener when state is changed', () => {
    const {subscribe, dispose} = create();
    const handle = jest.fn();
    const unsubscribe = subscribe(handle);
    global.window.emit('blur');
    global.window.emit('focus');
    dispose();
    expect(typeof unsubscribe).toBe('function');
    expect(handle.mock.calls.length).toBe(2);
});

test('can ubsubscribe listener', () => {
    const {subscribe, dispose} = create();
    const handle = jest.fn();
    const unsubscribe = subscribe(handle);
    unsubscribe();
    global.window.emit('blur');
    dispose();
    expect(handle.mock.calls.length).toBe(0);
});

test('will update last action time on user interaction', async () => {
    const {getLastActionAt, dispose} = create();
    const now = Date.now();
    await timeout(2);
    global.document.documentElement.emit('mousemove');
    dispose();
    expect(typeof getLastActionAt()).toBe('number');
    expect(getLastActionAt()).toBeGreaterThan(now);
});

test('will change to inactive when window is blurred', () => {
    const {getState, dispose} = create();
    global.window.emit('blur');
    dispose();
    expect(getState()).toBe('inactive');
});

test('will change to inactive when document becomes hidden', () => {
    const {getState, dispose} = create();
    global.document.visibilityState = 'hidden';
    global.document.emit('visibilitychange');
    dispose();
    expect(getState()).toBe('inactive');
});

test('will change to active when window is refocused', () => {
    const {getState, dispose} = create();
    global.window.emit('blur');
    global.window.emit('focus');
    dispose();
    expect(getState()).toBe('active');
});

test('will change to active when document becomes visible', () => {
    const {getState, dispose} = create();
    global.window.emit('blur');
    global.document.visibilityState = 'visible';
    global.document.emit('visibilitychange');
    dispose();
    expect(getState()).toBe('active');
});

test('will change to unknown when exceeds idle time', async () => {
    const {getState, dispose} = create({maxIdleTime: 4});
    global.window.emit('focus');
    await timeout(5);
    dispose();
    expect(getState()).toBe('unknown');
});

test('will not change to active on mouse move when currently inactive', () => {
    const {getState, dispose} = create();
    global.document.visibilityState = 'hidden';
    global.document.emit('visibilitychange');
    global.document.documentElement.emit('mousemove');
    dispose();
    expect(getState()).toBe('inactive');
});
