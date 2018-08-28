// @flow
import React from 'react';
import styled from 'styled-components';
import logo from 'assets/img/nexum_logo.png';

const AppStyled = styled.div`
  padding: 200px;
  text-align: center;
  perspective: 300px;
  overflow: hidden;

  @keyframes rotate {
    from {transform: rotateY(0deg);}
    to {transform: rotateY(360deg);}
  }

  & div {
    animation-name: rotate;
    animation-duration: 6s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }
`;

const App = () => (
  <AppStyled>
    <div><img src={logo} alt="" /></div>
  </AppStyled>
);

export default App;
