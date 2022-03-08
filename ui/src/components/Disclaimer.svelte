<script>
    import {shrinkIn, shrinkOut} from '../lib/util.js';

    function showForABit(element) {
        setTimeout(() => {
            shrinkIn(element);
            setTimeout(() => shrinkOut(element), 45000);
        }, 5000);
    }
</script>

<div class="disclaimer" use:showForABit style="display: none;">
    Data is provided by
    <a href="//geonet.org.nz">Geonet</a> &amp;
    <a href="//gns.cri.nz">GNS Science</a> under the Creative Commons license.
    <a href="//github.com/aSmallChild/quake-map">View on github</a>.
</div>

