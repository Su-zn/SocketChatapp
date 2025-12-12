import React from 'react';
import {BrowserRouter as Router,Routes,Route} from 'react-router-dom';
import Joinui from './components/joinui';
import Chatui from './components/chatui';

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Joinui />} />
        <Route path='/chat' element={<Chatui />} />
      </Routes>
    </Router>

  )
}

export default App;
