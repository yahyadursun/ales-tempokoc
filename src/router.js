// Router Engine for TempoKoç (Client-Side Hash Router)

export class Router {
  static routes = {};
  static defaultRoute = '#/focustodo';
  static currentRoute = '';
  static routeChangeCallbacks = [];

  static init(routes, defaultRoute = '#/focustodo') {
    this.routes = routes;
    this.defaultRoute = defaultRoute;

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());

    // Intercept clicks on links or elements with data-route
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-route]');
      if (target) {
        e.preventDefault();
        const route = target.getAttribute('data-route');
        if (route) {
          this.navigate(route);
        }
      }
    });

    // Initial route check
    this.handleRoute();
  }

  static handleRoute() {
    let hash = window.location.hash || this.defaultRoute;
    if (hash === '#/' || hash === '') hash = '#/focustodo';

    // Normalize routes like #pomodoro to #/focustodo
    if (hash === '#pomodoro' || hash === '#focustodo') hash = '#/focustodo';
    if (hash === '#exam') hash = '#/exam';
    if (hash === '#analytics') hash = '#/analytics';

    this.currentRoute = hash;

    // Execute matching view switcher
    let matched = false;
    for (const [path, callback] of Object.entries(this.routes)) {
      if (path === hash) {
        matched = true;
        callback();
        break;
      }
    }

    if (!matched && this.routes[this.defaultRoute]) {
      this.currentRoute = this.defaultRoute;
      this.routes[this.defaultRoute]();
    }

    this.updateActiveNavLinks(this.currentRoute);
    this.notifyRouteChange(this.currentRoute);
  }

  static navigate(route) {
    if (!route.startsWith('#')) route = '#' + route;
    if (window.location.hash !== route) {
      window.location.hash = route;
    } else {
      this.handleRoute();
    }
  }

  static updateActiveNavLinks(activeRoute) {
    document.querySelectorAll('[data-route]').forEach(el => {
      const linkRoute = el.getAttribute('data-route');
      if (linkRoute) {
        const isMatch = linkRoute === activeRoute || 
          (activeRoute === '#/focustodo' && (linkRoute === '#/pomodoro' || linkRoute === '#/focustodo'));
        
        el.classList.toggle('active', isMatch);

        // Dynamic styling for header navigation buttons (.nav-link)
        if (el.classList.contains('nav-link')) {
          if (isMatch) {
            if (activeRoute === '#/exam') {
              el.className = 'nav-link active px-3.5 py-2 rounded-xl transition text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer font-bold';
            } else if (activeRoute === '#/analytics') {
              el.className = 'nav-link active px-3.5 py-2 rounded-xl transition text-white bg-gradient-to-r from-cyan-600 to-blue-600 shadow-md shadow-cyan-600/20 flex items-center gap-2 cursor-pointer font-bold';
            } else {
              el.className = 'nav-link active px-3.5 py-2 rounded-xl transition text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer font-bold';
            }
          } else {
            el.className = 'nav-link px-3.5 py-2 rounded-xl transition text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center gap-2 cursor-pointer font-medium';
          }
        }
      }
    });
  }

  static onRouteChange(callback) {
    this.routeChangeCallbacks.push(callback);
    return () => {
      this.routeChangeCallbacks = this.routeChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  static notifyRouteChange(route) {
    this.routeChangeCallbacks.forEach(cb => {
      try {
        cb(route);
      } catch (e) {
        console.error('Route listener error:', e);
      }
    });
  }
}
