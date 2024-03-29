export const Configs = {
  constants: {
    enviroment: process.env['NODE_ENV'] ?? '',
  },

  backendRoutes: {
    home: 'home',
    details: (movieDetailsId: string | number) => `details/${movieDetailsId}`,
    search: (keyword: string | number) => `search/${keyword}`,
    movie: (id: string | number) => `movie/${id}`,
    series: (id: string | number, season: number = 1) =>
      `series/${id}/${season}`,
  },

  routeRootNames: {
    home: '',
    catalog: 'catalog',
    details: {
      name: 'details/:id',
      build: (id: number) => `details/${id}`,
    },
    signIn: 'sign-in',
    signUp: 'sign-up',
    error: '404',
  },
};
