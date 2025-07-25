import PageHeader from "./layouts/PageHeader"
import SideBar from "./layouts/SideBar"
import { Outlet } from "react-router-dom"

const Layout = () => {
  return (
    <div className="max-h-screen flex flex-col">
      <PageHeader />
        <div className="grid grid-cols-[auto,1fr] flex-grow-1 overflow-auto">
            <SideBar />

            <Outlet />  
        </div>
    </div>
  )
}

export default Layout
