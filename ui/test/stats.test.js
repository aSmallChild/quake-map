/**
 * @jest-environment jsdom
 */

import {render} from '@testing-library/svelte';
import Stats from '../src/components/Stats.svelte';

test('should render', () => {
    const stats = {unique_connections: 12, connected_clients: 52};
    // const results = render(Stats, {props: {stats, 'data-id': 123}});
    const results = render(Stats, {props: {stats}});

    expect(results.getByText(/52\s+clients/)).toBeTruthy();
    expect(results.getByText(/12\s+viewers/)).toBeTruthy();
});