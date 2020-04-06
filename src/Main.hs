{-# LANGUAGE OverloadedStrings, DeriveGeneric #-}
module Main where

import Control.Monad
import Data.Text as T
import qualified Data.ByteString.Lazy as B
import GHC.Generics
import System.Console.GetOpt
import System.Directory
import System.Environment
import System.Exit
import System.FilePath
import Data.Aeson
import Network.Hoggl
import Network.Hoggl.Types

-- GOALS
-- Push token into Hoggl
-- Take workspaces and display

data Flag = Help | Start String | Stop | List deriving (Show, Eq)

data Config = Config { token :: String } deriving (Show, Generic)
instance FromJSON Config

defaultConfig :: Config
defaultConfig = Config { token = "" }

options :: [OptDescr Flag]
options = [
            Option "h" ["help"]
              (NoArg Help)
              "display this message",
            Option "s" ["start"]
              (ReqArg Start "DESCRIPTION")
              "start a new timer",
            Option "S" ["stop"]
              (NoArg Stop)
              "stops the current timer",
            Option "l" ["list"]
              (NoArg List)
              "lists timers for the day"
          ]

configPath :: IO FilePath
configPath = do
  homeDir <- getHomeDirectory
  return $ homeDir </> ".tog"

loadConfig :: IO Config
loadConfig = do
  cf <- configPath >>= B.readFile
  let config = case (decode cf :: Maybe Config) of
            Just a -> a
            Nothing -> defaultConfig
  return config

runFlag :: Token -> Flag -> IO ()
runFlag token Help = putStrLn $ usageInfo "USAGE:" options

runFlag token Stop = do
  tryStopRunning token
  return ()

runFlag token List = undefined

newTimeEntry :: String -> TimeEntryStart
newTimeEntry desc = TES {
                      tesDescription = Just(T.pack desc),
                      tesTags = [],
                      tesPid = Nothing,
                      tesCreatedWith = "Tog by Todd"
                                   }

main :: IO ()
main = do
  cmdArgs <- getArgs
  (flags, args, _) <- return $ getOpt RequireOrder options cmdArgs

  config <- loadConfig
  let runner = runFlag $ Api(token config)
  mapM runner flags
  exitSuccess
