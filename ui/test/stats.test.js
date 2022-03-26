/**
 * @jest-environment jsdom
 */

import {render} from '@testing-library/svelte';
import Stats from '../src/components/Stats.svelte';

test('should render', () => {
    const stats = {unique_connections: 12, connected_clients: 52};
    render(Stats, {props: {stats}});
    const div = document.querySelector('div.stats');
    expect(div.textContent).toEqual('52 clients 12 viewers');
});