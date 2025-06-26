import React, { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";
