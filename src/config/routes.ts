import Inventory from '../screens/Inventory';
import Login from '../screens/Login';
import Settlements from '../screens/Settlements';
import Spendings from '../screens/Spendings';
import Valve from '../screens/Valve';
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
    path: '/inventory',
    component: () => Inventory,
    name: 'Inwentarz',
    isProtected: true
  },
  {
    path: '/rozliczenia',
    component: () => Settlements,
    name: 'Rozliczenia',
    isProtected: true
  },
  {
    path: '/skarbonka',
    component: () => Valve,
    name: 'Skarbonka',
    isProtected: true
  },
  {
    path: '/wydatki',
    component: () => Spendings,
    name: 'Wydatki',
    isProtected: true
  }
];

export default routes;
