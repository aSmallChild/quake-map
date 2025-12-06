import {render} from '@testing-library/svelte';
import Stats from '../src/components/Stats.svelte';

test('should render', async () => {
    const stats = {unique_connections: 12, connected_clients: 52};
    const {rerender} = render(Stats, {props: {stats}});
    const div = document.querySelector('div.stats');
    expect(div.textContent).toEqual('52 clients 12 viewers');

    await rerender({stats: {unique_connections: 13, connected_clients: 52}});
    expect(div.textContent).toEqual('52 clients 13 viewers');
});
