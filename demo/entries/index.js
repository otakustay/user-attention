import {create} from '../../src';

const container = document.createElement('ol');
container.id = 'log';
document.body.appendChild(container);

const attention = create();

const log = () => {
    const item = document.createElement('li');
    const now = new Date();
    // eslint-disable-next-line max-len
    item.innerHTML = `<date dateTime="${now.toISOString()}">${now.toLocaleString()}</date>: user's active state is ${attention.getState()}`;
    document.querySelector('#log').appendChild(item);
};

attention.subscribe(log);
log();
