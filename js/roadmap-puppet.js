(function () {
  var BAR_Y = 4;

  function stopX(roadmap, stop) {
    var rr = roadmap.getBoundingClientRect();
    var sr = stop.getBoundingClientRect();
    return sr.left - rr.left + sr.width / 2;
  }

  function stopCardTop(roadmap, stop) {
    var rr = roadmap.getBoundingClientRect();
    var sr = stop.getBoundingClientRect();
    return sr.top - rr.top;
  }

  function layoutRig(roadmap, rig, stops, activeIndex) {
    var bar = rig.querySelector('.roadmap-puppet-rig__bar');
    var drop = rig.querySelector('.roadmap-puppet-rig__drop');
    var anchor = rig.querySelector('.roadmap-puppet-rig__anchor');
    var joints = rig.querySelectorAll('.roadmap-puppet-rig__joint');

    var xs = stops.map(function (stop) {
      return stopX(roadmap, stop);
    });

    var barLeft = xs[0];
    var barWidth = xs[xs.length - 1] - xs[0];

    bar.style.top = BAR_Y + 'px';
    bar.style.left = barLeft + 'px';
    bar.style.width = barWidth + 'px';

    var cardTop = stopCardTop(roadmap, stops[activeIndex]);
    var dropHeight = Math.max(0, cardTop - BAR_Y);

    drop.style.left = xs[activeIndex] + 'px';
    drop.style.top = BAR_Y + 'px';
    drop.style.height = dropHeight + 'px';

    anchor.style.left = xs[activeIndex] + 'px';
    anchor.style.top = BAR_Y + 'px';

    joints.forEach(function (joint, i) {
      joint.style.left = xs[i] + 'px';
      joint.style.top = BAR_Y + 'px';
      joint.classList.toggle('is-active', i === activeIndex);
    });
  }

  document.querySelectorAll('.roadmap--puppet').forEach(function (roadmap) {
    var rig = roadmap.querySelector('.roadmap-puppet-rig');
    if (!rig) return;

    var stops = Array.prototype.slice.call(roadmap.querySelectorAll('.stop'));
    var activeIndex = -1;

    function setActive(index) {
      if (index < 0 || index >= stops.length) return;
      var firstShow = !roadmap.classList.contains('is-puppet-live');

      roadmap.classList.add('is-puppet-live');
      layoutRig(roadmap, rig, stops, index);

      stops.forEach(function (el, i) {
        el.classList.toggle('is-puppet-active', i === index);
      });

      if (firstShow) {
        rig.classList.remove('is-drawn');
        requestAnimationFrame(function () {
          rig.classList.add('is-drawn');
        });
      }

      activeIndex = index;
    }

    function clearActive() {
      roadmap.classList.remove('is-puppet-live');
      rig.classList.remove('is-drawn');
      stops.forEach(function (el) {
        el.classList.remove('is-puppet-active');
      });
      activeIndex = -1;
    }

    stops.forEach(function (stop, index) {
      stop.addEventListener('pointerenter', function () {
        setActive(index);
      });
    });

    roadmap.addEventListener('pointerleave', function (e) {
      if (e.relatedTarget && roadmap.contains(e.relatedTarget)) return;
      clearActive();
    });

    window.addEventListener('resize', function () {
      if (activeIndex >= 0) layoutRig(roadmap, rig, stops, activeIndex);
    });
  });
})();
