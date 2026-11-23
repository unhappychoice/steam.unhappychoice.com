const withTransition = (update) => document.startViewTransition ? document.startViewTransition(update) : update();
