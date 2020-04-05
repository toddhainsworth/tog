{-# LANGUAGE OverloadedStrings, DeriveGeneric #-}
module Main where

import qualified Data.ByteString.Lazy as B
import GHC.Generics
import System.Directory
import System.FilePath
import Data.Aeson

-- GOALS
-- Read JSON file
-- Parse JSON
-- Get token from JSON
-- Push token into Hoggl
-- Take workspaces and display
data Config = Config { token :: String } deriving (Show, Generic)
instance FromJSON Config

configPath :: IO FilePath
configPath = do
  homeDir <- getHomeDirectory
  return $ homeDir </> ".tog"

loadConfig :: IO Config
loadConfig = do
  pth <- configPath
  cf <- configPath >>= B.readFile
  let config = case (decode cf :: Maybe Config) of
            Just a -> a
            Nothing -> Config {}
  return config

main :: IO ()
main = do
  config <- loadConfig
  putStrLn $ show config
