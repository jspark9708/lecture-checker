import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { format, addDays, subDays } from "date-fns";
import ko from "date-fns/locale/ko";
import "./App.css"; // Import the CSS file
import LinkIcon from "@mui/icons-material/Link";
import VideocamIcon from "@mui/icons-material/Videocam";
import DescriptionIcon from "@mui/icons-material/Description";
import AddToDriveIcon from '@mui/icons-material/AddToDrive';

function App() {
  const [lectures, setLectures] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  useEffect(() => {
    // 페이지 로드 시와 날짜 변경 시 파일 불러오기
    loadExcelFile();
  }, [currentDate]);

  useEffect(() => {
    // 체크 상태 변경 시 진행률 업데이트
    updateProgress();
    saveCheckboxState(); // 체크 상태를 저장
  }, [lectures]);

  const loadExcelFile = () => {
    const timetableFilePath = "/excel_files/timetable.xlsx"; // timetable 파일 경로
    const assignmentFilePath = "/excel_files/assignmenttable.xlsx"; // assignment 파일 경로

    // Load timetable.xlsx
    fetch(timetableFilePath)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.arrayBuffer();
      })
      .then((data) => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const today = format(currentDate, "M.d(eee)", { locale: ko });
        const filteredLectures = jsonData
          .filter((row) => row[7] === today)
          .map((row) => ({
            lectureName: row[0],
            clip: row[3],
            isChecked: false,
          }));

        setLectures(filteredLectures);
        loadCheckboxState(filteredLectures); // 체크 상태를 불러오기
      })
      .catch((error) => {
        console.error("Error loading Excel file:", error);
      });

    //
    // Load assignmenttable.xlsx
    fetch(assignmentFilePath)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.arrayBuffer();
      })
      .then((data) => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const today = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        ); // 오늘 날짜의 년, 월, 일만 사용
        console.log(today);
        const filteredAssignments = jsonData
          .filter((row) => {
            const startDate = new Date(row[2]);
            const endDate = new Date(row[3]);

            // 년, 월, 일만 비교
            const startDateOnly = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              startDate.getDate()
            );
            const endDateOnly = new Date(
              endDate.getFullYear(),
              endDate.getMonth(),
              endDate.getDate()
            );

            console.log("start", startDateOnly);
            return startDateOnly <= today && endDateOnly >= today;
          })
          .map((row) => ({
            name: row[4],
            startDate: row[2],
            endDate: row[3],
            content: row[5] ? row[5].replace(/\n/g, "<br>") : "",
            relatedLecture: row[6] ? row[6].replace(/\n/g, "<br>") : "",
          }));

        setAssignments(filteredAssignments);
      })
      .catch((error) => {
        console.error("Error loading Excel file:", error);
      });
  };

  const handleCheckboxChange = (index) => {
    const updatedLectures = [...lectures];
    updatedLectures[index].isChecked = !updatedLectures[index].isChecked;
    setLectures(updatedLectures);

    // 모든 강의가 체크되었는지 확인
    const allChecked = updatedLectures.every((lecture) => lecture.isChecked);
    if (allChecked) {
      const messages = [
        "축하합니다! 모든 강의를 완료하셨습니다. ദ്ദി=´∀｀)",
        "잘 했어요! 모든 강의를 다 들으셨네요. ( •̀ ω •́ )✧",
        "대단해요! 모든 강의를 완료하셨습니다. (๑˃̵ᴗ˂̵)و",
        "모든 강의를 마쳤습니다! 멋져요! ✧*｡٩(ˊᗜˋ*)و✧*｡",
        "강의 완주를 축하합니다! (っˆڡˆς)",
        "오늘의 강의를 모두 들었습니다~ ___〆(・∀・)",
        "오늘 하루도 수고하셨어요 ദ്ദി^._.^)",
      ];
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      alert(randomMessage);
    }
  };

  const updateProgress = () => {
    const totalLectures = lectures.length;
    if (totalLectures === 0) return 0;

    const checkedLectures = lectures.filter((lecture) => lecture.isChecked);
    const checkedCount = checkedLectures.length;

    return (checkedCount / totalLectures) * 100;
  };

  const handlePrevDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const saveCheckboxState = () => {
    const state = lectures.map((lecture) => lecture.isChecked);
    localStorage.setItem(
      format(currentDate, "yyyy-MM-dd"),
      JSON.stringify(state)
    );
  };

  const loadCheckboxState = (filteredLectures) => {
    const savedState = localStorage.getItem(format(currentDate, "yyyy-MM-dd"));
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      const updatedLectures = filteredLectures.map((lecture, index) => ({
        ...lecture,
        isChecked: parsedState[index] || false,
      }));
      setLectures(updatedLectures);
    } else {
      setLectures(filteredLectures);
    }
  };

  const today = format(currentDate, "M.d(eee)", { locale: ko });

  // 버튼을 클릭했을 때 구글 스프레드시트를 여는 함수
  const handleOpenSpreadsheet = () => {
    window.open(
      "https://docs.google.com/spreadsheets/d/1iA2H4W0R9-TEZWoTtNWOv8OXkCYj14MwKdHU89htCU0/edit?gid=1610991686#gid=1610991686",
      "_blank"
    );
  };

  const calculateDDay = (endDate) => {
    // 입력된 문자열을 Date 객체로 변환
    const end = new Date(endDate);
    const today = new Date();

    // 시간 차이 계산 (밀리초 단위)
    const timeDiff = end.getTime() - today.getTime();
    // 일 단위 차이 계산
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  };
  function getDdayColor(endDate) {
    const dday = calculateDDay(endDate);

    if (dday > 7) {
      return "green";
    } else if (dday > 3) {
      return "orange";
    } else {
      return "red";
    }
  }

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="App">
      <div className="horiz">
        <h1>오늘의 필수 강의</h1>
        <div className="current-time">{today}</div>
        <div className="date-navigation">
          <button onClick={handlePrevDay}>&lt;</button>
          <button onClick={handleToday}>오늘</button>
          <button onClick={handleNextDay}>&gt;</button>
        </div>
      </div>
      {lectures.length > 0 ? (
        <div className="fixed">
          <div className="progress-container">
            <div className="progress-label">
              진행률: {updateProgress().toFixed(2)}%
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${updateProgress()}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <p></p>
      )}
      {lectures.length > 0 ? (
        <div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>강의명</th>
                <th>소주제(Clip)</th>
                <th>수강 완료</th>
              </tr>
            </thead>
            <tbody>
              {lectures.map((lecture, index) => (
                <tr
                  key={index}
                  className={lecture.isChecked ? "completed" : ""}
                >
                  <td>{index + 1}</td>
                  <td>{lecture.lectureName}</td>
                  <td>{lecture.clip}</td>
                  <td>
                    {format(currentDate, "yyyy-MM-dd") ===
                      format(new Date(), "yyyy-MM-dd") && (
                      <input
                        className="centerize"
                        type="checkbox"
                        checked={lecture.isChecked}
                        onChange={() => handleCheckboxChange(index)}
                        style={{ width: "20px", height: "20px" }} // 크기 조정
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <p>오늘 수강할 강의가 없습니다.</p>
        </div>
      )}
      <div>
        <div className="margin">
          <h1>오늘의 과제</h1>
          {assignments.length > 0 ? (
            <div className="assignments-container">
              {assignments.map((assignment, index) => (
                <div key={index} className="assignment-box">
                  <div className="assignment-info">
                    <h3>{assignment.name}</h3>
                    <p>
                      기간: {assignment.startDate} ~ {assignment.endDate}
                    </p>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: `과제내용: ${assignment.content}`,
                      }}
                    ></p>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: `관련강의:<br> ${assignment.relatedLecture}`,
                      }}
                    ></p>
                  </div>
                  <div
                    className={`dday-box ${getDdayColor(assignment.endDate)}`}
                  >
                    <p className="day_font">
                      D-{calculateDDay(assignment.endDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>오늘 제출할 과제가 없습니다.</p>
          )}
        </div>
      </div>
      <button className="fixed-button" onClick={openModal}>
        <LinkIcon style={{ fontSize: 40 }} />
      </button>

      {isModalOpen && (
        <>
          <div className="modal-overlay" onClick={closeModal} />
          <div className="modal">
            <p className="margin-left">관련 링크 빠른 이동</p>
            <button className="modal-close-button" onClick={closeModal}>
              &times;
            </button>
            <div className="btn_container">
              <a
                href="https://us06web.zoom.us/j/85167230171"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn_site1"
              >
                <VideocamIcon className="margin-right" />
                <span>Zoom 링크</span>
              </a>
              <a
                href="https://docs.google.com/spreadsheets/d/1iA2H4W0R9-TEZWoTtNWOv8OXkCYj14MwKdHU89htCU0/edit?gid=1610991686#gid=1610991686"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn_site2"
              >
                <DescriptionIcon className="margin-right" />
                <span>
                커리큘럼
                <br />
                스프레드시트
                </span>
              </a>
              <a
                href="https://drive.google.com/drive/folders/12eDf_as0vHaAbJs-X_TN9RCpNxd7iUfZ"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn_site3"
              >
                <AddToDriveIcon className="margin-right" />
                <span>
                공유용
                <br />
                드라이브
                </span>
              </a>
              <a
                href="https://sincere-nova-ec6.notion.site/UXUI-3-6855aa5c75ad4baaad3f764ea269fa37?pvs=74"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn_site4"
              >
                <img
                  src={`${process.env.PUBLIC_URL}/notion-icon.svg`}
                  alt="Notion Icon"
                  style={{ width: "20px", height: "20px", fillOpacity: "0"}}
                  className="margin-right"
                />
                <span>노션 페이지</span>
              </a>
              <a
                href="https://sincere-nova-ec6.notion.site/c4d9d4c412894866810a2e7ae2550653?v=27d89739f3f6419d8131fc24ae8ec37e"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn_site5"
              >
                <img
                  src={`${process.env.PUBLIC_URL}/notion-icon.svg`}
                  alt="Notion Icon"
                  style={{ width: "20px", height: "20px", fillOpacity: "0"}}
                  className="margin-right"
                />
                <span>
                부트캠프
                <br />
                콘텐츠캘린더
                </span>
              </a>
            </div>
          </div>
        </>
      )}
      <div className="centerize margin_a">
        {/*<a onClick={handleOpenSpreadsheet}>
          - 수강생 커리큘럼 스프레드시트 열기 -
        </a>*/}
      </div>
      <div className="centerize gray margin">
        <p>ദ്ദി^._.^)</p>
        <p>해당 사이트는 모바일 화면에 최적화 되어있습니다.</p>
        <p>Copyright ⓒ 2024 jspark9708 all right reserved.</p>
      </div>
    </div>
  );
}

export default App;
