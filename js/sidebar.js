(function () {
    var ITEMS = [
        { label: 'Dashboard', href: 'admin-dashboard.html' },
        { label: 'Members', href: 'admin-members.html' },
        { label: 'Classes', href: 'admin-classes.html' },
        { label: 'Plans', href: 'admin-plans.html' },
        { label: '\uD83D\uDCE9 Contact Messages', href: 'admin-messages.html' },
        { label: '\uD83D\uDEAA Logout', href: '#', id: 'logoutBtn', cls: 'logout-link' }
    ];

    var current = window.location.pathname.split('/').pop() || 'admin-dashboard.html';

    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = '<ul>' + ITEMS.map(function (item) {
        var active = item.href === current;
        var classes = [];
        if (item.cls) classes.push(item.cls);
        if (active) classes.push('active');
        var classStr = classes.length ? ' class="' + classes.join(' ') + '"' : '';
        var idStr = item.id ? ' id="' + item.id + '"' : '';
        return '<li><a href="' + item.href + '"' + idStr + classStr + '>' + item.label + '</a></li>';
    }).join('') + '</ul>';
})();
