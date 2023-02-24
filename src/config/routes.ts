import Login from '../screens/Login';
import MagazynWrapper from '../screens/MagazynWrapper';
import RozliczeniaWrapper from '../screens/RozliczeniaWrapper';
import Spendings from '../screens/Wydatki';
import Skarbonka from '../screens/Skarbonka';
import Screenshots from '../screens/Screenshots';
interface RouteType {
  path: string;
  component: any;
  name: string;
  isProtected: boolean;
}

const routes: RouteType[] = [
  {
    path: '/login',
    component: Login,
    name: 'Login Screen',
    isProtected: false
  },
  {
    path: '/',
    component: () => MagazynWrapper,
    name: 'Magazyn',
    isProtected: true
  },
  {
    path: '/rozliczenia',
    component: () => RozliczeniaWrapper,
    name: 'Rozliczenia',
    isProtected: true
  },
  {
    path: '/skarbonka',
    component: () => Skarbonka,
    name: 'Skarbonka',
    isProtected: true
  },
  {
    path: '/wydatki',
    component: () => Spendings,
    name: 'Wydatki',
    isProtected: true
  },
  {
    path: '/screenshots',
    component: () => Screenshots,
    name: 'Screenshots',
    isProtected: true
  }
];

export default routes;
